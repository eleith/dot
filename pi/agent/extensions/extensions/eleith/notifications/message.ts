import { basename } from "node:path";
import type { AgentActivityOutcome } from "@earendil-works/pi-coding-agent";

export interface NotificationMessage {
	readonly title: string;
	readonly body: string;
}

export function notificationTitle(paneTitle: string | undefined, cwd: string, sessionName?: string): string {
	const fallback = [sessionName, basename(cwd)].filter(Boolean).join(" - ");
	const title = cleanTitle(paneTitle ?? "") || fallback;
	if (/π/i.test(title) || /(?:^|\W)pi(?:$|\W)/i.test(title)) return title;
	return `π · ${title}`;
}

export function completionMessage(title: string, outcome: AgentActivityOutcome | undefined, durationMs: number): NotificationMessage {
	const duration = formatDuration(durationMs);
	switch (outcome) {
		case "completed": return { title, body: `Ready for input · completed in ${duration}` };
		case "aborted": return { title, body: `Run stopped · ${duration}` };
		case "error": return { title, body: `Run ended with an error · ${duration}` };
		default: return { title, body: `Ready for input · ${duration}` };
	}
}

function cleanTitle(value: string): string {
	return value.replace(/[\x00-\x1f\x7f-\x9f]/g, " ").trim().slice(0, 120);
}

function formatDuration(ms: number): string {
	const totalSeconds = Math.max(0, Math.round(ms / 1000));
	if (totalSeconds < 60) return `${totalSeconds}s`;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	if (minutes < 60) return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return remainingMinutes > 0 ? `${hours}h${remainingMinutes}m` : `${hours}h`;
}
