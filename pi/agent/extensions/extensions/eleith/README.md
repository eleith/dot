# Eleith's Pi extensions

These are my small changes to Pi's terminal and editor, loaded together by `index.ts`. I keep the controls under `/eleith` so there is one command to remember. Type `/eleith` or `/eleith help` to see what is available.

The [welcome card](welcome/README.md) shows where a new session started, while [compact editor chrome](compact-editor-chrome/README.md) keeps model, context, and Git details near the prompt. [Tool rendering](tool-rendering/README.md) makes calls and results easier to scan. To follow a run from outside the editor, there is [terminal progress](progress/README.md), [title status](title-status/README.md), and [desktop notifications](notifications/README.md). [Command completion](command-completion/README.md) makes their `/eleith` actions easier to find.

Use `/eleith <feature> <action>` to control a feature, for example `/eleith progress test` or `/eleith title-status hide`. Each linked README has the details. Switchable features start enabled and reset when extensions reload; the welcome card and command completion have no on/off switch. Pi's built-in terminal progress is disabled in `~/.pi/agent/settings.json` so it does not compete with this one.
