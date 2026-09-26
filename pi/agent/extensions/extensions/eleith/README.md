# my π extensions

a handful of small personal extensions to Pi, only using documented APIs.

| extension | description |
| --- | --- |
| [command completion](command-completion/README.md) | `/eleith` shortcut to interact with all the below extensions  |
| [compact editor chrome](compact-editor-chrome/README.md) | minimal status details around the prompt input. less is more |
| [context](context/README.md) | `/eleith context` for status; `extend` or `restore` to change the window |
| [notifications](notifications/README.md) | notifications on turn end using notify-send (with OSC777 fallback for remote support) |
| [progress](progress/README.md) | OSC9;4 progress bars (with TMUX wrapping support) while waiting on a turn|
| [title status](title-status/README.md) | simple terminal titles with icon progress indicators|
| [tool rendering](tool-rendering/README.md) | minimal and pretty rendering for bash/ls/grep/read tool calls |
| [welcome](welcome/README.md) | grow a tree everytime you start pi |

## why

because extending π is at the ❤️ of how and why it was built

## how to use

copy this folder to your extensions folder, run `/reload` and then run `/eleith help` to learn more

most extensions can be disabled (except for the welcome 🌳)

`/eleith context` and `/context-window` show read-only window, compaction, and
last-request cache status. only `extend` and `restore` change the window, for
Codex GPT-6 Sol and Astra only. these are local windows, not verified server
limits. compaction counts cover the current branch; cache reports describe the
last request, not live cache residency. no context keyboard shortcuts.
