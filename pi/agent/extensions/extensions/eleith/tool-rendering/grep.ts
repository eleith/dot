import {
	createGrepToolDefinition,
	type AgentToolResult,
	type ExtensionAPI,
	type GrepToolDetails,
	type GrepToolInput,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import {
	defaultFrameWidth,
	frameError,
	frameResultWithBottomLabel,
	frameStatus,
	frameTop,
} from "./frame.ts";
import { normalizeLineEndings, textFromResult } from "./tool-result.ts";
import { moreLines } from "./preview.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinGrepTool = ReturnType<typeof createGrepToolDefinition>;
type GrepRenderCall = NonNullable<BuiltinGrepTool["renderCall"]>;
type GrepRenderResult = NonNullable<BuiltinGrepTool["renderResult"]>;
type GrepTheme = Parameters<GrepRenderResult>[2];

interface GrepDisplayDetails extends GrepToolDetails {
	readonly rendering?: {
		readonly pattern: string;
		readonly text: string;
	};
}

export function registerGrepRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createGrepToolDefinition(cwd);

	const renderCall: GrepRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent ?? new Text("", 0, 0);
		component.setText(frameTop(grepTitle(args, theme), frameStatus(context), theme, defaultFrameWidth()));
		return component;
	};

	const renderResult: GrepRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) return original.renderResult(result, options, theme, context);
		const component = context.lastComponent ?? new Text("", 0, 0);
		component.setText(renderGrepResult(result as AgentToolResult<GrepDisplayDetails>, options.expanded, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "grep",
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const result = await original.execute(toolCallId, params, signal, onUpdate, ctx) as AgentToolResult<GrepDisplayDetails>;
			const text = normalizeLineEndings(textFromResult(result));
			result.details = {
				...(result.details ?? {}),
				rendering: {
					pattern: params.pattern,
					text,
				},
			};
			return result;
		},
		renderCall,
		renderResult,
	});
}

function grepTitle(args: GrepToolInput, theme: GrepTheme): string {
	const path = args.path ? ` ${theme.fg("muted", `in ${args.path}`)}` : "";
	const glob = args.glob ? ` ${theme.fg("muted", `(${args.glob})`)}` : "";
	return `${theme.fg("toolTitle", theme.bold("grep"))} ${theme.fg("accent", args.pattern)}${path}${glob}`;
}

function renderGrepResult(
	result: AgentToolResult<GrepDisplayDetails>,
	expanded: boolean,
	theme: GrepTheme,
	context: Parameters<GrepRenderResult>[3],
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameError(textFromResult(result) || "Error", theme, width);

	const details = result.details?.rendering;
	const text = details?.text ?? textFromResult(result);
	const lines = text.split("\n").filter(Boolean);
	const matches = lines.filter(isMatchLine);
	const limit = result.details?.matchLimitReached ? " · limit reached" : "";
	const truncated = result.details?.truncation?.truncated || result.details?.linesTruncated ? " · truncated" : "";
	if (matches.length === 0) return frameResultWithBottomLabel(theme.fg("dim", "(no matches)"), `0 matches${limit}${truncated}`, status, theme, width);

	// Three matches across three files use at most eight grouped lines (headings and spacing included).
	// Context and truncation notices remain available when expanded, but cannot grow the preview.
	const shown = expanded ? lines : matches.slice(0, 3);
	const rendered = renderGroupedMatches(shown.join("\n"), details?.pattern ?? "", theme);
	const hidden = matches.length - Math.min(matches.length, 3);
	const hasExtraOutput = lines.length > shown.length;
	const body = !expanded && hasExtraOutput
		? `${rendered}\n${hidden ? moreLines(hidden, theme, hidden === 1 ? "match" : "matches") : theme.fg("muted", "… expand tool output to view more")}`
		: rendered;
	return frameResultWithBottomLabel(body, `${matches.length} ${matches.length === 1 ? "match" : "matches"}${limit}${truncated}`, status, theme, width);
}

function renderGroupedMatches(text: string, pattern: string, theme: GrepTheme): string {
	const highlight = makeHighlighter(pattern, theme);
	const output: string[] = [];
	let currentFile = "";

	for (const rawLine of text.split("\n")) {
		if (!rawLine) continue;
		if (rawLine.trim() === "--") {
			output.push(theme.fg("dim", "  ···"));
			continue;
		}

		const match = rawLine.match(/^(.+?)[:-](\d+)[:-](.*)$/);
		if (!match) {
			output.push(rawLine);
			continue;
		}

		const [, file, lineNumber, content] = match;
		if (file !== currentFile) {
			if (currentFile) output.push("");
			output.push(theme.fg("accent", file));
			currentFile = file;
		}

		const lineNumberWidth = Math.max(3, lineNumber.length);
		output.push(`  ${theme.fg("dim", lineNumber.padStart(lineNumberWidth, " "))} ${theme.fg("borderMuted", "│")} ${highlight(content)}`);
	}

	return output.join("\n");
}

function isMatchLine(line: string): boolean {
	return /^.+?:\d+:/.test(line);
}

function makeHighlighter(pattern: string, theme: GrepTheme): (line: string) => string {
	if (!pattern) return (line) => line;
	try {
		const regex = new RegExp(pattern, "gi");
		return (line: string) => line.replace(regex, (match) => theme.fg("warning", theme.bold(match)));
	} catch {
		const lowerPattern = pattern.toLowerCase();
		return (line: string) => {
			const index = line.toLowerCase().indexOf(lowerPattern);
			if (index < 0 || lowerPattern.length === 0) return line;
			return `${line.slice(0, index)}${theme.fg("warning", theme.bold(line.slice(index, index + pattern.length)))}${line.slice(index + pattern.length)}`;
		};
	}
}
