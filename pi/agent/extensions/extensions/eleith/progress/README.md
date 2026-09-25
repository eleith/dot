# progress

makes a progress bar visible while an LLM is working. 

it sends OSC 9;4 directly outside tmux or through a tmux passthrough when inside tmux.

## why

Pi's built-in progress doesn't work well with tmux (it works. just not well).

## how to use

make an llm call and see the progress bar in your terminal chrome

use `/eleith progress toggle` to disable it.
