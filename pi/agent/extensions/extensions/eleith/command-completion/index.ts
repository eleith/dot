import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const COMMAND_PREFIX = "/eleith ";

const areas = [
	{ name: "welcome", description: "Render the startup card", actions: ["show", "auto", "large", "small", "tiny"] },
	{ name: "notifications", description: "Desktop notifications", actions: ["on", "off", "test", "toggle"] },
	{ name: "progress", description: "Terminal progress indicator", actions: ["on", "off", "test", "toggle"] },
	{ name: "compact-editor-chrome", description: "Editor prompt status", actions: ["show", "hide", "toggle"] },
	{ name: "title-status", description: "Terminal title status", actions: ["show", "hide", "toggle"] },
	{ name: "tool-rendering", description: "Tool output display", actions: ["show", "hide", "toggle"] },
	{ name: "help", description: "Show all /eleith commands", actions: [] },
] as const;

export function completeEleith(prefix: string) {
	const input = prefix.trimStart().toLowerCase();
	const space = input.indexOf(" ");
	if (space === -1) {
		const matches = areas.filter((area) => area.name.startsWith(input));
		return matches.length ? matches.map((area) => ({ value: area.name, label: area.name, description: area.description })) : null;
	}

	const area = areas.find((candidate) => candidate.name === input.slice(0, space));
	if (!area || !area.actions.length || input.slice(space + 1).includes(" ")) return null;
	const matches = area.actions.filter((action) => action.startsWith(input.slice(space + 1)));
	return matches.length ? matches.map((action) => ({
		value: `${area.name} ${action}`,
		label: action,
		description: area.name === "welcome"
			? action === "show" || action === "auto" ? "Use automatic tree sizing" : `Show the ${action} tree`
			: `${action} ${area.description.toLowerCase()}`,
	})) : null;
}

// Pi's explicit Tab completion requests files after the first command space.
// Route /eleith arguments back through the same completer used while typing.
export function registerEleithTabCompletion(pi: ExtensionAPI): void {
	let registered = false;
	pi.on("session_start", (_event, ctx) => {
		if (registered || ctx.mode !== "tui") return;
		registered = true;
		ctx.ui.addAutocompleteProvider((base) => ({
			triggerCharacters: base.triggerCharacters,
			getSuggestions(lines, cursorLine, cursorCol, options) {
				const beforeCursor = (lines[cursorLine] ?? "").slice(0, cursorCol);
				if (cursorLine === 0 && beforeCursor.startsWith(COMMAND_PREFIX)) {
					const prefix = beforeCursor.slice(COMMAND_PREFIX.length);
					const items = completeEleith(prefix);
					return items?.length ? { items, prefix } : null;
				}
				return base.getSuggestions(lines, cursorLine, cursorCol, options);
			},
			applyCompletion: (lines, cursorLine, cursorCol, item, prefix) =>
				base.applyCompletion(lines, cursorLine, cursorCol, item, prefix),
			shouldTriggerFileCompletion(lines, cursorLine, cursorCol) {
				const beforeCursor = (lines[cursorLine] ?? "").slice(0, cursorCol);
				if (cursorLine === 0 && beforeCursor.startsWith(COMMAND_PREFIX)) return true;
				return base.shouldTriggerFileCompletion?.(lines, cursorLine, cursorCol) ?? true;
			},
		}));
	});
}
