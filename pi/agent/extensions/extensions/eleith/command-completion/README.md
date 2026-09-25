# Command completion

Tab should stay with `/eleith` when you are choosing an action, but Pi normally switches to file suggestions after a slash command's first space. This wrapper sends `/eleith` arguments back to the command completer without changing completion for other commands or paths.

Type `/eleith ` to browse features, then try `/eleith progress te` and press Tab to complete `/eleith progress test`. It works automatically; there is nothing to turn on.
