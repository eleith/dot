import {
	createFindToolDefinition,
	type AgentToolResult,
	type ExtensionAPI,
	type FindToolDetails,
	type FindToolInput,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { basename, dirname } from "node:path";
import { defaultFrameWidth, frameError, frameResultWithBottomLabel, frameStatus, frameTop } from "./frame.ts";
import { normalizeLineEndings, textFromResult } from "./tool-result.ts";
import { moreLines, previewLines } from "./preview.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinFindTool = ReturnType<typeof createFindToolDefinition>;
type FindRenderCall = NonNullable<BuiltinFindTool["renderCall"]>;
type FindRenderResult = NonNullable<BuiltinFindTool["renderResult"]>;
type FindTheme = Parameters<FindRenderResult>[2];

interface FindDisplayDetails extends FindToolDetails {
	readonly rendering?: {
		readonly text: string;
	};
}

export function registerFindRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createFindToolDefinition(cwd);

	const renderCall: FindRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent ?? new Text("", 0, 0);
		component.setText(frameTop(findTitle(args, theme), frameStatus(context), theme, defaultFrameWidth()));
		return component;
	};

	const renderResult: FindRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) return original.renderResult(result, options, theme, context);
		const component = context.lastComponent ?? new Text("", 0, 0);
		component.setText(renderFindResult(result as AgentToolResult<FindDisplayDetails>, options.expanded, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "find",
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const result = await original.execute(toolCallId, params, signal, onUpdate, ctx) as AgentToolResult<FindDisplayDetails>;
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

function findTitle(args: FindToolInput, theme: FindTheme): string {
	const path = args.path ? ` ${theme.fg("muted", `in ${args.path}`)}` : "";
	const limit = args.limit ? ` ${theme.fg("muted", `(${args.limit} files)`)}` : "";
	return `${theme.fg("toolTitle", theme.bold("find"))} ${theme.fg("accent", args.pattern)}${path}${limit}`;
}

function renderFindResult(
	result: AgentToolResult<FindDisplayDetails>,
	expanded: boolean,
	theme: FindTheme,
	context: Parameters<FindRenderResult>[3],
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameError(textFromResult(result) || "Error", theme, width);

	const text = result.details?.rendering?.text ?? textFromResult(result);
	const paths = text.trim() === "No files found matching pattern"
		? []
		: text.split("\n").filter((line) => line.trim().length > 0);
	// Three paths in separate directories use at most eight grouped lines.
	const { shown, hidden } = previewLines(paths, expanded, 3);
	const rendered = paths.length > 0 ? renderGroupedPaths(shown, theme) : theme.fg("dim", "(no files)");
	const body = hidden ? `${rendered}\n${moreLines(hidden, theme, "files")}` : rendered;
	const limit = result.details?.resultLimitReached ? " · limit reached" : "";
	return frameResultWithBottomLabel(body, `${paths.length} files${limit}`, status, theme, width);
}

function renderGroupedPaths(paths: string[], theme: FindTheme): string {
	const groups = new Map<string, string[]>();
	for (const path of paths) {
		const dir = dirname(path) || ".";
		const file = basename(path);
		const existing = groups.get(dir);
		if (existing) existing.push(file);
		else groups.set(dir, [file]);
	}

	const output: string[] = [];
	for (const [dir, files] of groups) {
		if (output.length > 0) output.push("");
		output.push(theme.fg("accent", `${dir}/`));
		files.forEach((file, index) => {
			const marker = index === files.length - 1 ? "└──" : "├──";
			output.push(`  ${theme.fg("borderMuted", marker)} ${file}`);
		});
	}
	return output.join("\n");
}
