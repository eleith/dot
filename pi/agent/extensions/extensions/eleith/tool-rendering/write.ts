import {
	createWriteToolDefinition,
	type AgentToolResult,
	type ExtensionAPI,
	type WriteToolInput,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { defaultFrameWidth, frameError, frameResultWithBottomLabel, frameStatus, frameTop } from "./frame.ts";
import { normalizeLineEndings, textFromResult } from "./tool-result.ts";
import { moreLines, previewLines } from "./preview.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinWriteTool = ReturnType<typeof createWriteToolDefinition>;
type WriteRenderCall = NonNullable<BuiltinWriteTool["renderCall"]>;
type WriteRenderResult = NonNullable<BuiltinWriteTool["renderResult"]>;
type WriteTheme = Parameters<WriteRenderResult>[2];

interface WriteDisplayDetails {
	readonly rendering?: {
		readonly content: string;
	};
}

export function registerWriteRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createWriteToolDefinition(cwd);

	const renderCall: WriteRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent ?? new Text("", 0, 0);
		component.setText(frameTop(writeTitle(args, theme), frameStatus(context), theme, defaultFrameWidth()));
		return component;
	};

	const renderResult: WriteRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) {
			const builtinContext = context.lastComponent instanceof Text ? { ...context, lastComponent: undefined } : context;
			return original.renderResult(result, options, theme, builtinContext);
		}
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(renderWriteResult(result as AgentToolResult<WriteDisplayDetails>, options.expanded, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "write",
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const result = await original.execute(toolCallId, params, signal, onUpdate, ctx) as AgentToolResult<WriteDisplayDetails>;
			result.details = {
				...(result.details ?? {}),
				rendering: {
					content: normalizeLineEndings(params.content),
				},
			};
			return result;
		},
		renderCall,
		renderResult,
	});
}

function writeTitle(args: WriteToolInput, theme: WriteTheme): string {
	return `${theme.fg("toolTitle", theme.bold("write"))} ${theme.fg("accent", args.path)}`;
}

function renderWriteResult(
	result: AgentToolResult<WriteDisplayDetails>,
	expanded: boolean,
	theme: WriteTheme,
	context: Parameters<WriteRenderResult>[3],
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameError(textFromResult(result) || "Error", theme, width);

	const details = result.details?.rendering;
	const lineCount = details ? countLines(details.content) : 0;
	const preview = details ? previewContent(details.content, expanded, theme) : theme.fg("dim", textFromResult(result) || "written");
	return frameResultWithBottomLabel(preview, `${lineCount} lines`, status, theme, width);
}

function previewContent(content: string, expanded: boolean, theme: WriteTheme): string {
	const { shown, hidden } = previewLines(content.split("\n"), expanded, 10);
	const rendered = shown.map((line, index) => {
		const number = String(index + 1).padStart(3, " ");
		return `${theme.fg("dim", number)} ${theme.fg("borderMuted", "│")} ${line}`;
	});
	if (hidden) rendered.push(moreLines(hidden, theme));
	return rendered.join("\n");
}

function countLines(content: string): number {
	return content.length === 0 ? 0 : content.split("\n").length;
}
