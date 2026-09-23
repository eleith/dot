import {
	createReadToolDefinition,
	type AgentToolResult,
	type ExtensionAPI,
	type ReadToolDetails,
	type ReadToolInput,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import {
	defaultFrameWidth,
	frameResultWithBottomLabel,
	frameStatus,
	frameToolError,
	frameTop,
	resultLabel,
} from "./frame.ts";
import { normalizeLineEndings, textFromResult } from "./tool-result.ts";
import { previewLines } from "./preview.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinReadTool = ReturnType<typeof createReadToolDefinition>;
type ReadRenderCall = NonNullable<BuiltinReadTool["renderCall"]>;
type ReadRenderResult = NonNullable<BuiltinReadTool["renderResult"]>;
type ReadTheme = Parameters<ReadRenderResult>[2];

interface ReadDisplayDetails extends ReadToolDetails {
	readonly rendering?: {
		readonly text: string;
		readonly offset: number;
	};
}

export function registerReadRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createReadToolDefinition(cwd);

	const renderCall: ReadRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(frameTop(readTitle(args, theme), frameStatus(context), theme, defaultFrameWidth()));
		return component;
	};

	const renderResult: ReadRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) return original.renderResult(result, options, theme, context);
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(renderReadResult(result as AgentToolResult<ReadDisplayDetails>, options.expanded, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "read",
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const result = await original.execute(toolCallId, params, signal, onUpdate, ctx) as AgentToolResult<ReadDisplayDetails>;
			const text = textFromResult(result);
			if (text) {
				result.details = {
					...(result.details ?? {}),
					rendering: {
						text: normalizeLineEndings(text),
						offset: params.offset ?? 1,
					},
				};
			}
			return result;
		},
		renderCall,
		renderResult,
	});
}

function readTitle(args: ReadToolInput, theme: ReadTheme): string {
	const offset = args.offset ? ` ${theme.fg("muted", `from ${args.offset}`)}` : "";
	const limit = args.limit ? ` ${theme.fg("muted", `(${args.limit} lines)`)}` : "";
	return `${theme.fg("toolTitle", theme.bold("read"))} ${theme.fg("accent", args.path)}${offset}${limit}`;
}

function renderReadResult(
	result: AgentToolResult<ReadDisplayDetails>,
	expanded: boolean,
	theme: ReadTheme,
	context: Parameters<ReadRenderResult>[3],
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameToolError(textFromResult(result), expanded, theme, width);

	if (result.content.some((item) => item.type === "image")) {
		return frameResultWithBottomLabel("", resultLabel("image", expanded, 0, theme), status, theme, width);
	}
	const details = result.details?.rendering;
	const text = (details?.text ?? normalizeLineEndings(textFromResult(result))).replace(/\n$/, "");
	const lines = text ? text.split("\n") : [];
	const { shown, hidden } = previewLines(lines, expanded, 10);
	const truncation = result.details?.truncation ? " · truncated" : "";
	const summary = `${lines.length} lines${truncation}`;
	const body = renderNumberedLines(shown, details?.offset ?? context.args.offset ?? 1, theme);
	return frameResultWithBottomLabel(body, resultLabel(summary, expanded, hidden, theme), status, theme, width);
}

function renderNumberedLines(lines: string[], offset: number, theme: ReadTheme): string {
	const lastLineNumber = offset + Math.max(0, lines.length - 1);
	const numberWidth = Math.max(3, String(lastLineNumber).length);
	return lines.map((line, index) => {
		const lineNumber = String(offset + index).padStart(numberWidth, " ");
		return `${theme.fg("dim", lineNumber)} ${theme.fg("borderMuted", "│")} ${line}`;
	}).join("\n");
}
