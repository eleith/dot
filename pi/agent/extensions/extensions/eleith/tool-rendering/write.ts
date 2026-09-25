import {
	createWriteToolDefinition,
	type AgentToolResult,
	type ExtensionAPI,
	type WriteToolInput,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { defaultFrameWidth, frameResultWithBottomLabel, frameStatus, frameToolError, frameTop, resultLabel } from "./frame.ts";
import { normalizeLineEndings, textFromResult } from "./tool-result.ts";
import { previewLines } from "./preview.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinWriteTool = ReturnType<typeof createWriteToolDefinition>;
type WriteRenderCall = NonNullable<BuiltinWriteTool["renderCall"]>;
type WriteRenderResult = NonNullable<BuiltinWriteTool["renderResult"]>;
type WriteTheme = Parameters<WriteRenderResult>[2];

export function registerWriteRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createWriteToolDefinition(cwd);

	const renderCall: WriteRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(frameTop(writeTitle(args, theme), frameStatus(context), theme, defaultFrameWidth()));
		return component;
	};

	const renderResult: WriteRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) {
			const builtinContext = context.lastComponent instanceof Text ? { ...context, lastComponent: undefined } : context;
			return original.renderResult(result, options, theme, builtinContext);
		}
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(renderWriteResult(result, options.expanded, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "write",
		renderShell: "self",
		renderCall,
		renderResult,
	});
}

function writeTitle(args: WriteToolInput, theme: WriteTheme): string {
	return `${theme.fg("toolTitle", theme.bold("write"))} ${theme.fg("accent", args.path)}`;
}

function renderWriteResult(
	result: AgentToolResult,
	expanded: boolean,
	theme: WriteTheme,
	context: Parameters<WriteRenderResult>[3],
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameToolError(textFromResult(result), expanded, theme, width);

	const rawContent = normalizeLineEndings(context.args.content);
	const content = rawContent.replace(/\n$/, "");
	const lines = rawContent ? content.split("\n") : [];
	const { shown, hidden } = previewLines(lines, expanded, 10);
	const body = shown.map((line, index) => {
		const number = String(index + 1).padStart(3, " ");
		return `${theme.fg("dim", number)} ${theme.fg("borderMuted", "│")} ${line}`;
	}).join("\n");
	return frameResultWithBottomLabel(body, resultLabel(`${lines.length} lines`, expanded, hidden, theme), status, theme, width);
}
