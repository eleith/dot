import {
	createBashToolDefinition,
	type AgentToolResult,
	type BashToolDetails,
	type BashToolInput,
	type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import {
	defaultFrameWidth,
	formatDuration,
	frameError,
	frameResult,
	frameResultWithBottomLabel,
	frameStatus,
	frameTop,
} from "./frame.ts";
import { textFromResult } from "./tool-result.ts";
import { moreLines, previewLines } from "./preview.ts";
import { isToolChromeEnabled } from "./state.ts";

type BuiltinBashTool = ReturnType<typeof createBashToolDefinition>;
type BashRenderCall = NonNullable<BuiltinBashTool["renderCall"]>;
type BashRenderResult = NonNullable<BuiltinBashTool["renderResult"]>;
type BashRenderContext = Parameters<BashRenderResult>[3];
type BashRenderOptions = Parameters<BashRenderResult>[1];
type BashTheme = Parameters<BashRenderResult>[2];

interface BashDisplayDetails extends BashToolDetails {
	readonly rendering?: {
		readonly output: string;
		readonly exitCode: number | null;
	};
}

export function registerBashRendering(pi: ExtensionAPI, cwd: string): void {
	const original = createBashToolDefinition(cwd);

	const renderCall: BashRenderCall = (args, theme, context) => {
		if (!isToolChromeEnabled() && original.renderCall) return original.renderCall(args, theme, context);
		const component = context.lastComponent ?? new Text("", 0, 0);
		const status = frameStatus(context);
		const width = defaultFrameWidth();
		component.setText(`${frameTop(buildBashTitle(args, theme), status, theme, width)}\n${frameResult(renderCommand(args.command, context.expanded, theme), status, theme, width)}`);
		return component;
	};

	const renderResult: BashRenderResult = (result, options, theme, context) => {
		if (!isToolChromeEnabled() && original.renderResult) {
			// The built-in bash renderer uses a Container, not our Text component.
			const builtinContext = context.lastComponent instanceof Text ? { ...context, lastComponent: undefined } : context;
			return original.renderResult(result, options, theme, builtinContext);
		}
		const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
		component.setText(renderBashResult(result as AgentToolResult<BashDisplayDetails>, options, theme, context));
		return component;
	};

	pi.registerTool({
		...original,
		name: "bash",
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const result = await original.execute(toolCallId, params, signal, onUpdate, ctx) as AgentToolResult<BashDisplayDetails>;
			const output = textFromResult(result);
			result.details = {
				...(result.details ?? {}),
				rendering: {
					output,
					// The built-in tool throws for nonzero exits; returned results succeeded.
					exitCode: 0,
				},
			};
			return result;
		},
		renderCall,
		renderResult,
	});
}

function buildBashTitle(args: BashToolInput, theme: BashTheme): string {
	const timeout = args.timeout ? ` ${theme.fg("muted", `(${args.timeout}s timeout)`)}` : "";
	return `${theme.fg("toolTitle", theme.bold("bash"))} ${theme.fg("accent", commandLabel(args.command))}${timeout}`;
}

function commandLabel(command: string): string {
	return firstCommandWord(command) ?? "command";
}

function firstCommandWord(command: string): string | undefined {
	const firstLine = command.split("\n").find((line) => line.trim().length > 0)?.trim();
	return firstLine?.match(/^[^\s;&|()]+/)?.[0];
}

function renderBashResult(
	result: AgentToolResult<BashDisplayDetails>,
	options: BashRenderOptions,
	theme: BashTheme,
	context: BashRenderContext,
): string {
	const status = frameStatus(context);
	const width = defaultFrameWidth();
	if (context.isError) return frameError(collapsedBody(textFromResult(result) || "Error", options.expanded, theme), theme, width);

	const timing = updateTiming(context, options);
	const details = result.details?.rendering;
	const parsed = parseBashOutput(details?.output ?? textFromResult(result), details?.exitCode ?? null);
	const body = collapsedBody(parsed.body, options.expanded, theme);
	const label = bashSummaryLabel(parsed, timing, theme);
	return label
		? frameResultWithBottomLabel(body, label, status, theme, width)
		: frameResult(body, status, theme, width);
}

interface ParsedBashOutput {
	readonly body: string;
	readonly exitCode: number | null;
	readonly timedOut: boolean;
	readonly aborted: boolean;
}

function parseBashOutput(output: string, fallbackExitCode: number | null): ParsedBashOutput {
	const tail = output.match(/(?:\n\n|^)Command (?:exited with code (\d+)|timed out after \d+ seconds|aborted)\s*$/);
	if (!tail) return { body: output, exitCode: fallbackExitCode, timedOut: false, aborted: false };

	const tailText = tail[0];
	return {
		body: output.slice(0, tail.index),
		exitCode: tail[1] ? Number(tail[1]) : fallbackExitCode,
		timedOut: /timed out/.test(tailText),
		aborted: /aborted/.test(tailText),
	};
}

interface TimingSnapshot {
	readonly elapsedMs: number | undefined;
}

function updateTiming(context: BashRenderContext, options: BashRenderOptions): TimingSnapshot {
	const state = context.state;
	if (context.executionStarted && state.startedAt === undefined) {
		state.startedAt = Date.now();
		state.endedAt = undefined;
	}

	const stillRunning = Boolean(options.isPartial) && !context.isError;
	if (state.startedAt !== undefined && stillRunning && !state.interval) {
		state.interval = setInterval(() => context.invalidate(), 1000);
	}
	if (!stillRunning) {
		if (state.startedAt !== undefined) state.endedAt ??= Date.now();
		if (state.interval) {
			clearInterval(state.interval);
			state.interval = undefined;
		}
	}

	return {
		elapsedMs: state.startedAt === undefined ? undefined : (state.endedAt ?? Date.now()) - state.startedAt,
	};
}

function bashSummaryLabel(parsed: ParsedBashOutput, timing: TimingSnapshot, theme: BashTheme): string {
	const duration = timing.elapsedMs === undefined ? "" : theme.fg("dim", formatDuration(timing.elapsedMs));
	let status = "";
	if (parsed.timedOut) status = theme.fg("warning", "⚡ timed out");
	else if (parsed.aborted) status = theme.fg("warning", "⚡ aborted");
	else if (parsed.exitCode !== null) {
		status = parsed.exitCode === 0
			? theme.fg("success", "✓ exit 0")
			: theme.fg("error", `✗ exit ${parsed.exitCode}`);
	}
	return [duration, status].filter(Boolean).join(" ");
}

function renderCommand(command: string, expanded: boolean, theme: BashTheme): string {
	const lines = command.trimEnd().split("\n");
	if (lines.length === 1 && lines[0]?.trim() === "") return "";
	const { shown, hidden } = previewLines(lines, expanded, 5);
	const body = shown.map((line, index) => {
		const prompt = index === 0 ? "$ " : "> ";
		return `${theme.fg("dim", prompt)}${theme.fg("toolOutput", line)}`;
	}).join("\n");
	return hidden ? `${body}\n${moreLines(hidden, theme)}` : body;
}

function collapsedBody(body: string, expanded: boolean, theme: BashTheme): string {
	const lines = body ? body.split("\n") : [];
	const maxLines = 5;
	if (expanded || lines.length <= maxLines) return body;
	return [theme.fg("muted", `… ${lines.length - maxLines} earlier lines (expand tool output to view)`), ...lines.slice(-maxLines)].join("\n");
}
