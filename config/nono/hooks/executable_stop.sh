#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Configuration & Constants
# ==============================================================================
readonly SESSION_DIR="/tmp/nono-session"
readonly LOCK_FILE="${SESSION_DIR}/.session.lock"
readonly REF_FILE="${SESSION_DIR}/.refcount"

# ==============================================================================
# Session & Lock Lifecycle
# ==============================================================================
acquire_lock() {
  exec 200>"$LOCK_FILE"
  flock -x 200
}

release_lock() {
  flock -u 200
}

decrement_refcount() {
  local count=1
  if [[ -f "$REF_FILE" ]]; then
    count=$(cat "$REF_FILE" 2>/dev/null || echo 1)
  fi

  count=$((count - 1))
  echo "$count"
}

# ==============================================================================
# Service Teardown
# ==============================================================================
terminate_pid_file() {
  local pid_file="$1"
  local pid

  [[ -f "$pid_file" ]] || return 0
  pid=$(cat "$pid_file" 2>/dev/null || true)

  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    # Graceful shutdown first
    kill "$pid" 2>/dev/null || true

    # Poll up to 0.5s for clean exit
    for _ in {1..10}; do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.05
    done

    # Force kill if process failed to terminate
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
}

teardown_all_services() {
  for pid_file in "${SESSION_DIR}"/*.pid; do
    [[ -f "$pid_file" ]] || continue
    terminate_pid_file "$pid_file"
  done
}

cleanup_session_artifacts() {
  # Clean up ephemeral runtime files while leaving the directory and lock intact
  rm -f "${SESSION_DIR}"/*.sock \
        "${SESSION_DIR}"/*.pid \
        "${SESSION_DIR}"/*.log \
        "$REF_FILE"
}

# ==============================================================================
# Main
# ==============================================================================
main() {
  # Short-circuit if session or lock file does not exist
  [[ -d "$SESSION_DIR" && -f "$LOCK_FILE" ]] || exit 0

  acquire_lock

  local remaining
  remaining=$(decrement_refcount)

  if [[ "$remaining" -le 0 ]]; then
    teardown_all_services
    cleanup_session_artifacts
  else
    echo "$remaining" > "$REF_FILE"
  fi

  release_lock
}

main "$@"
