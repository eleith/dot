# Terminal progress

Pi's built-in progress was slow to update through tmux, so this sends OSC 9;4 through tmux passthrough instead, or directly when tmux is not in use. It keeps the terminal's indeterminate bar alive with a one-second update and clears it when the run ends. A single 0% frame at the start may help the animation begin at the left edge.

Progress starts on. Use `/eleith progress off`, `on`, or `toggle` to change it, and `/eleith progress test` to watch a 20-second run while Pi is idle. The test also works when automatic progress is off. Pi's built-in bar is disabled in `~/.pi/agent/settings.json` so both versions do not write to it at once; this one does not need access to the tmux socket.
