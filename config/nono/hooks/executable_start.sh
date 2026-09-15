#!/usr/bin/env bash
set -euo pipefail

# Ensure standard user tool locations are available
export PATH="/usr/local/bin:/usr/bin:/bin:${HOME}/.local/bin:${PATH}"

# ==============================================================================
# Configuration & Constants
# ==============================================================================
readonly SESSION_DIR="/tmp/nono-session"
readonly LOCK_FILE="${SESSION_DIR}/.session.lock"
readonly REF_FILE="${SESSION_DIR}/.refcount"
readonly BW_SOCK="${HOME}/.var/app/com.bitwarden.desktop/data/.bitwarden-ssh-agent.sock"

# ==============================================================================
# Logging Helpers
# ==============================================================================
log_warn() {
  echo "[WARN] nono-start: $*" >&2
}

log_error() {
  echo "[ERROR] nono-start: $*" >&2
}

# ==============================================================================
# Session & Lock Lifecycle
# ==============================================================================
init_session_dir() {
  if [[ -d "$SESSION_DIR" && ! -O "$SESSION_DIR" ]]; then
    log_error "Session directory '${SESSION_DIR}' is not owned by UID $(id -u)"
    exit 1
  fi
  mkdir -p -m 700 "$SESSION_DIR"
}

acquire_lock() {
  exec 200>"$LOCK_FILE"
  flock -x 200
}

release_lock() {
  flock -u 200
  exec 200>&-
}

increment_refcount() {
  local count=0
  if [[ -f "$REF_FILE" ]]; then
    count=$(cat "$REF_FILE" 2>/dev/null || echo 0)
    [[ "$count" =~ ^[0-9]+$ ]] || count=0
  fi
  echo "$((count + 1))" > "$REF_FILE"
}

is_service_running() {
  local pid_file="$1"
  local sock_file="$2"
  local pid

  [[ -f "$pid_file" && -S "$sock_file" ]] || return 1
  pid=$(cat "$pid_file" 2>/dev/null || true)
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

wait_for_socket() {
  local sock_file="$1"
  local timeout_ms="${2:-1000}"
  local elapsed=0

  while [[ ! -S "$sock_file" ]]; do
    if (( elapsed >= timeout_ms )); then
      return 1
    fi
    sleep 0.05
    elapsed=$((elapsed + 50))
  done
  return 0
}

# ==============================================================================
# Service Proxies
# ==============================================================================
setup_dbus_proxy() {
  local pid_file="${SESSION_DIR}/dbus.pid"
  local sock_file="${SESSION_DIR}/dbus.sock"
  local log_file="${SESSION_DIR}/dbus-proxy.log"
  local real_host_bus="unix:path=/run/user/$(id -u)/bus"

  if is_service_running "$pid_file" "$sock_file"; then
    return 0
  fi

  if ! command -v xdg-dbus-proxy &>/dev/null; then
    log_warn "'xdg-dbus-proxy' not found. Desktop notifications will be disabled."
    return 0
  fi

  rm -f "$sock_file" "$pid_file"
  # Disassociate stdout/stderr and close lock FD 200
  nohup xdg-dbus-proxy "$real_host_bus" "$sock_file" \
    --talk="org.freedesktop.Notifications" 200>&- &> "$log_file" &
  echo $! > "$pid_file"
  disown $!

  if ! wait_for_socket "$sock_file" 1000; then
    log_warn "Timed out waiting for D-Bus socket at ${sock_file}"
  fi
}

setup_ssh_bridge() {
  local pid_file="${SESSION_DIR}/ssh.pid"
  local sock_file="${SESSION_DIR}/ssh.sock"
  local mode_file="${SESSION_DIR}/ssh.mode"
  local log_file="${SESSION_DIR}/ssh-bridge.log"

  local target_mode="blackhole"
  [[ -S "$BW_SOCK" ]] && target_mode="bitwarden"

  # Restart service if target mode changed (e.g. Bitwarden became available)
  if is_service_running "$pid_file" "$sock_file"; then
    local current_mode
    current_mode=$(cat "$mode_file" 2>/dev/null || echo "")
    if [[ "$current_mode" == "$target_mode" ]]; then
      return 0
    fi
    kill "$(cat "$pid_file")" 2>/dev/null || true
  fi

  rm -f "$sock_file" "$pid_file"

  if ! command -v socat &>/dev/null; then
    log_warn "'socat' is not installed. SSH forwarding disabled."
    return 0
  fi

  if [[ "$target_mode" == "bitwarden" ]]; then
    nohup socat UNIX-LISTEN:"$sock_file",fork,unlink-early,mode=600 UNIX-CONNECT:"$BW_SOCK" \
      200>&- </dev/null &> "$log_file" &
  else
    log_warn "Bitwarden socket not found at ${BW_SOCK}. Serving dummy blackhole socket."
    nohup socat UNIX-LISTEN:"$sock_file",fork,unlink-early,mode=600 EXEC:/bin/true \
      200>&- </dev/null &> "$log_file" &
  fi

  echo $! > "$pid_file"
  echo "$target_mode" > "$mode_file"
  disown $!

  if ! wait_for_socket "$sock_file" 1000; then
    log_warn "Timed out waiting for SSH bridge socket at ${sock_file}"
  fi
}

# ==============================================================================
# Main
# ==============================================================================
main() {
  init_session_dir
  acquire_lock
  increment_refcount

  setup_dbus_proxy
  setup_ssh_bridge

  release_lock
}

main "$@"
