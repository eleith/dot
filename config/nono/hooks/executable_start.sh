#!/usr/bin/env bash
set -euo pipefail

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
}

increment_refcount() {
  local count=0
  if [[ -f "$REF_FILE" ]]; then
    count=$(cat "$REF_FILE" 2>/dev/null || echo 0)
  fi
  echo "$((count + 1))" > "$REF_FILE"
}

# Checks that both the PID is alive and the socket file exists
is_service_running() {
  local pid_file="$1"
  local sock_file="$2"
  local pid

  [[ -f "$pid_file" && -S "$sock_file" ]] || return 1
  pid=$(cat "$pid_file" 2>/dev/null || true)
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
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

  rm -f "$sock_file"
  xdg-dbus-proxy "$real_host_bus" "$sock_file" \
    --talk="org.freedesktop.Notifications" &> "$log_file" &
  echo $! > "$pid_file"

  for _ in {1..20}; do
    [[ -S "$sock_file" ]] && return 0
    sleep 0.05
  done

  log_warn "Timed out waiting for D-Bus socket at ${sock_file}"
}

setup_ssh_bridge() {
  local pid_file="${SESSION_DIR}/ssh.pid"
  local sock_file="${SESSION_DIR}/ssh.sock"

  if is_service_running "$pid_file" "$sock_file"; then
    return 0
  fi

  rm -f "$sock_file"

  # 1. Check for socat
  if ! command -v socat &>/dev/null; then
    log_warn "'socat' is not installed. SSH forwarding disabled (cannot create socket)."
    return 0
  fi

  # 2. Check for Bitwarden upstream
  if [[ -S "$BW_SOCK" ]]; then
    socat UNIX-LISTEN:"$sock_file",fork,unlink-early,mode=600 UNIX-CONNECT:"$BW_SOCK" &
    echo $! > "$pid_file"
  else
    log_warn "Bitwarden socket not found at ${BW_SOCK}. Serving dummy blackhole socket."
    socat UNIX-LISTEN:"$sock_file",fork,unlink-early,mode=600 EXEC:/bin/true &
    echo $! > "$pid_file"
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
