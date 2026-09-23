import type { Theme, ThemeColor } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export type FrameStatus = "pending" | "success" | "error";

const STATUS_COLOR: Record<FrameStatus, ThemeColor> = {
	pending: "warning",
	success: "success",
	error: "error",
};

export interface RenderStateLike {
	readonly isError?: boolean;
	readonly isPartial?: boolean;
}

export function frameStatus(state: RenderStateLike): FrameStatus {
	if (state.isError) return "error";
	if (state.isPartial) return "pending";
	return "success";
}

export function frameTop(title: string, status: FrameStatus, theme: Theme, width: number): string {
	const border = borderPainter(status, theme);
	const safeWidth = Math.max(1, width);
	if (safeWidth < 6) return border("─".repeat(safeWidth));
	const maxTitleWidth = safeWidth - 5; // two dashes, spaces around title, at least one trailing dash
	const fittedTitle = visibleWidth(title) > maxTitleWidth ? truncateToWidth(title, maxTitleWidth, "…") : title;
	const trailingWidth = safeWidth - 4 - visibleWidth(fittedTitle);
	return `${border("──")} ${fittedTitle} ${border("─".repeat(trailingWidth))}`;
}

export function frameBottom(status: FrameStatus, theme: Theme, width: number): string {
	return borderPainter(status, theme)("─".repeat(Math.max(1, width)));
}

export function frameBottomWithLabel(label: string, status: FrameStatus, theme: Theme, width: number): string {
	const border = borderPainter(status, theme);
	const safeWidth = Math.max(1, width);
	if (safeWidth < 6) return border("─".repeat(safeWidth));
	const trailingBorderWidth = Math.min(8, safeWidth - 5);
	const maxLabelWidth = safeWidth - 3 - trailingBorderWidth; // leading dash, spaces around label, trailing dashes
	const fittedLabel = visibleWidth(label) > maxLabelWidth ? truncateToWidth(label, maxLabelWidth, "…") : label;
	const fillWidth = safeWidth - 2 - visibleWidth(fittedLabel) - trailingBorderWidth;
	return `${border("─".repeat(fillWidth))} ${fittedLabel} ${border("─".repeat(trailingBorderWidth))}`;
}

export function frameResult(body: string, status: FrameStatus, theme: Theme, width: number): string {
	const lines = body ? frameBody(body, width) : [];
	return [...lines, frameBottom(status, theme, width)].join("\n");
}

export function frameResultWithBottomLabel(body: string, label: string, status: FrameStatus, theme: Theme, width: number): string {
	const lines = body ? frameBody(body, width) : [];
	return [...lines, frameBottomWithLabel(label, status, theme, width)].join("\n");
}

export function frameError(message: string, theme: Theme, width: number): string {
	return frameResult(theme.fg("error", message), "error", theme, width);
}

export function formatDuration(ms: number): string {
	const totalSeconds = Math.max(0, ms) / 1000;
	if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
	const totalMinutes = Math.floor(totalSeconds / 60);
	const seconds = Math.floor(totalSeconds % 60);
	if (totalMinutes < 60) return seconds > 0 ? `${totalMinutes}m${seconds}s` : `${totalMinutes}m`;
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
}

export function defaultFrameWidth(max = 210): number {
	const raw = process.stdout.columns || Number.parseInt(process.env.COLUMNS ?? "", 10) || 120;
	return Math.max(1, Math.min(raw, max));
}

function frameBody(body: string, width: number): string[] {
	return body.split("\n").map((line) => truncateToWidth(line, Math.max(1, width), "…"));
}

function borderPainter(status: FrameStatus, theme: Theme): (text: string) => string {
	return (text: string) => theme.fg(STATUS_COLOR[status], text);
}
