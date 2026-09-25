# Tool rendering

Long tool output can take over the conversation. This gives Pi's built-in `bash`, `read`, `grep`, `ls`, `find`, `write`, and `edit` tools a consistent frame for calls, results, timing, and errors, with short previews until you expand a result. It also shows model wait time in the working message. Only the display changes; the tools still run and return results as before.

The frames start shown. Use `/eleith tool-rendering hide` to use Pi's built-in renderers, `/eleith tool-rendering show` to bring the frames back, or `/eleith tool-rendering toggle` to switch between them.
