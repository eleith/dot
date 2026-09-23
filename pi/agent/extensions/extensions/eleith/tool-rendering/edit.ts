import {
	createEditToolDefinition,
	type AgentToolResult,
	type EditToolDetails,
	type EditToolInput,
	type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { defaultFrameWidth, frameError, frameResultWithBottomLabel, frameStatus, frameTop } from "./frame.ts";
import { normalizeLineEndings, textFromResult } from "./tool-result.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinEditTool = ReturnType<typeof createEditToolDefinition>;
type EditRenderCall = NonNullable<BuiltinEditTool["renderCall"]>;
type EditRenderResult = NonNullable<BuiltinEditTool["renderResult"]>;
type EditTheme = Parameters<EditRenderResult>[2];

export function registerEditRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createEditToolDefinition(cwd);

	const renderCall: EditRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(frameTop(editTitle(args, theme), frameStatus(context), theme, defaultFrameWidth()));
		return component;
	};

	const renderResult: EditRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) {
			const builtinContext = context.lastComponent instanceof Text ? { ...context, lastComponent: undefined } : context;
			return original.renderResult(result, options, theme, builtinContext);
		}
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(renderEditResult(result as AgentToolResult<EditToolDetails>, options.expanded, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "edit",
		renderShell: "self",
		renderCall,
		renderResult,
	});
}

function editTitle(args: EditToolInput, theme: EditTheme): string {
	return `${theme.fg("toolTitle", theme.bold("edit"))} ${theme.fg("accent", args.path)} ${theme.fg("muted", `(${args.edits.length} edits)`)}`;
}

function renderEditResult(
	result: AgentToolResult<EditToolDetails>,
	expanded: boolean,
	theme: EditTheme,
	context: Parameters<EditRenderResult>[3],
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameError(textFromResult(result) || "Error", theme, width);

	const diff = normalizeLineEndings(result.details?.diff || result.details?.patch || textFromResult(result));
	const stats = diffStats(diff);
	const label = `${stats.added > 0 ? `+${stats.added}` : "+0"} ${stats.removed > 0 ? `-${stats.removed}` : "-0"}`;
	const body = expanded ? renderDiff(diff, theme) : theme.fg("dim", "(expand tool output to view diff)");
	return frameResultWithBottomLabel(body, label, status, theme, width);
}

function renderDiff(diff: string, theme: EditTheme): string {
	return diff.split("\n")
		.filter((line) => !line.startsWith("***") && !line.startsWith("---") && !line.startsWith("+++"))
		.map((line) => {
			if (line.startsWith("+")) return theme.fg("toolDiffAdded", line);
			if (line.startsWith("-")) return theme.fg("toolDiffRemoved", line);
			if (line.startsWith("@@")) return theme.fg("muted", line);
			return theme.fg("toolDiffContext", line);
		})
		.join("\n");
}

function diffStats(diff: string): { added: number; removed: number } {
	let added = 0;
	let removed = 0;
	for (const line of diff.split("\n")) {
		if (line.startsWith("+") && !line.startsWith("+++")) added++;
		if (line.startsWith("-") && !line.startsWith("---")) removed++;
	}
	return { added, removed };
}
