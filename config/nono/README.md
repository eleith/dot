
# nono

nono configs for sandboxing various agents

## bash

some agents forcefully load / write your `.bashrc`, but nono denies them.

unfortunately, passing in `bash --norc` doesn't always work either because some
agents strip flags.

instead, force agents to use the below shim

```bash
#!/bin/sh
# Agent shell shim. Claude Code keeps only the binary path from $SHELL and
# appends its own flags, so --norc has to be re-added here. Without it the
# snapshot's interactive bash reads ~/.bashrc, which deny_shell_configs
# blocks, and the denial is replayed on every tool result.
exec /usr/bin/bash --norc "$@"
```

the `base.json` profile expects this to be in `~/.local/bin/agent-bash`

## .nono.json

in each project folder, add a `.nono.json` so you can customize your nono
profile per project.

```json
{
  "$schema": "../../.config/nono/profile.schema.json",
  "extends": [
    "base",
    "nolabs-ai/agent",
    "gitea"
  ]
}
```

and run with `nono run --sandbox-policy external --profile .nono.json -- agent`
