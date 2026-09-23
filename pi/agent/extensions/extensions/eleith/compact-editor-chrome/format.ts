import { basename } from "node:path";
import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { GitStatus, ThemeLike } from "./types.ts";

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

type CompactionSettingsProvider = {
	readonly settingsManager?: {
		getCompactionSettings?(): { readonly enabled?: boolean } | undefined;
	};
};

export function topRightStatus(ctx: ExtensionContext, theme: ThemeLike, separator: string): string {
	return theme.fg("muted", wrap(joinSections([
		`${modelLabel(ctx.model)} (${thinkingLabel(ctx.thinkingLevel)})`,
		contextLabel(ctx),
	], separator)));
}

export function bottomLeftStatus(
	ctx: ExtensionContext,
	statuses: ReadonlyMap<string, string> | undefined,
	gitBranch: string | null,
	gitStatus: GitStatus | null,
	theme: ThemeLike,
	separator: string,
): string {
	const project = basename(ctx.cwd || process.cwd());
	const extensionStatus = extensionStatusLabel(statuses);
	const projectSection = `${extensionStatus ? `(${extensionStatus}) ` : ""}${project}`;
	const gitSection = gitLabel(gitBranch, gitStatus);
	return theme.fg("dim", wrap(joinSections([projectSection, gitSection], separator)));
}

export function extensionStatusLabel(statuses: ReadonlyMap<string, string> | undefined): string {
	if (!statuses || statuses.size === 0) return "";
	return [...statuses.values()]
		.map((value) => stripAnsi(value).trim())
		.filter(Boolean)
		.join(" · ");
}

export function contextLabel(ctx: ExtensionContext): string {
	const usage = ctx.getContextUsage();
	const percent = typeof usage?.percent === "number" ? `${Math.round(usage.percent)}%` : "?";
	return `ctx: ${percent} (${compactionMode(ctx)})`;
}

export function modelLabel(model: ExtensionContext["model"]): string {
	const label = model?.name || model?.id || "no model";
	return label.replace(/^gpt-/i, "GPT-");
}

export function thinkingLabel(level: ExtensionContext["thinkingLevel"]): string {
	switch (level) {
		case "minimal": return "min";
		case "medium": return "med";
		case "xhigh": return "xhi";
		case "off":
		case undefined:
			return "off";
		default:
			return level;
	}
}

export function gitLabel(branch: string | null, status: GitStatus | null): string {
	if (!branch) return "";
	if (!status || (status.staged === 0 && status.unstaged === 0 && status.untracked === 0)) return branch;
	return `${branch} +${status.staged} ~${status.unstaged} ?${status.untracked}`;
}

function compactionMode(ctx: ExtensionContext): "auto" | "manual" {
	const provider = ctx as ExtensionContext & CompactionSettingsProvider;
	return provider.settingsManager?.getCompactionSettings?.()?.enabled === false ? "manual" : "auto";
}

function joinSections(parts: readonly string[], separator: string): string {
	return parts.filter(Boolean).join(` ${separator} `);
}

function wrap(text: string): string {
	return text ? ` ${text} ` : "";
}

function stripAnsi(value: string): string {
	return value.replace(ANSI_PATTERN, "");
}
