# Notifications

When I switch to another window during a long run, I still want to know when Pi is ready for input. This sends a desktop notification after runs lasting at least 15 seconds, and after failed or aborted runs of any length. It uses the tmux pane title when available, falling back to the session name and directory if it cannot read it.

Automatic notifications start on. Use `/eleith notifications off` or `on` to change that, `/eleith notifications toggle` to switch it, and `/eleith notifications test` to send one now. Delivery tries `notify-send` first and falls back to the terminal's OSC 777 sequence, so a blocked tmux socket does not stop it.
