import {
	createLsToolDefinition,
	type AgentToolResult,
	type ExtensionAPI,
	type LsToolDetails,
	type LsToolInput,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { defaultFrameWidth, frameResultWithBottomLabel, frameStatus, frameToolError, frameTop, resultLabel } from "./frame.ts";
import { normalizeLineEndings, textFromResult } from "./tool-result.ts";
import { previewLines } from "./preview.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinLsTool = ReturnType<typeof createLsToolDefinition>;
type LsRenderCall = NonNullable<BuiltinLsTool["renderCall"]>;
type LsRenderResult = NonNullable<BuiltinLsTool["renderResult"]>;
type LsTheme = Parameters<LsRenderResult>[2];

interface LsDisplayDetails extends LsToolDetails {
	readonly rendering?: {
		readonly text: string;
	};
}

export function registerLsRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createLsToolDefinition(cwd);

	const renderCall: LsRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(frameTop(lsTitle(args, theme), frameStatus(context), theme, defaultFrameWidth()));
		return component;
	};

	const renderResult: LsRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) return original.renderResult(result, options, theme, context);
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(renderLsResult(result as AgentToolResult<LsDisplayDetails>, options.expanded, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "ls",
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const result = await original.execute(toolCallId, params, signal, onUpdate, ctx) as AgentToolResult<LsDisplayDetails>;
			result.details = {
				...(result.details ?? {}),
				rendering: {
					text: normalizeLineEndings(textFromResult(result)),
				},
			};
			return result;
		},
		renderCall,
		renderResult,
	});
}

function lsTitle(args: LsToolInput, theme: LsTheme): string {
	const limit = args.limit ? ` ${theme.fg("muted", `(${args.limit} entries)`)}` : "";
	return `${theme.fg("toolTitle", theme.bold("ls"))} ${theme.fg("accent", args.path ?? ".")}${limit}`;
}

function renderLsResult(
	result: AgentToolResult<LsDisplayDetails>,
	expanded: boolean,
	theme: LsTheme,
	context: Parameters<LsRenderResult>[3],
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameToolError(textFromResult(result), expanded, theme, width);

	const text = result.details?.rendering?.text ?? textFromResult(result);
	const lines = text.trim() === "(empty directory)"
		? []
		: text.split("\n").filter((line) => line.trim().length > 0);
	const { shown, hidden } = previewLines(lines, expanded, 10);
	const body = renderEntries(shown, theme);
	const limit = result.details?.entryLimitReached ? " · limit reached" : "";
	return frameResultWithBottomLabel(body, resultLabel(`${lines.length} entries${limit}`, expanded, hidden, theme), status, theme, width);
}

function renderEntries(lines: string[], theme: LsTheme): string {
	return lines.map((line, index) => {
		const isLast = index === lines.length - 1;
		const marker = isLast ? "└──" : "├──";
		return `${theme.fg("borderMuted", marker)} ${line.trim()}`;
	}).join("\n");
}
