import { execFile } from "node:child_process";
import { closeSync, openSync, writeSync } from "node:fs";
import { promisify } from "node:util";
import type { NotificationMessage } from "./message.ts";

const runFile = promisify(execFile);
const ESC = "\x1b";
const BEL = "\x07";

export type Delivery = "notify-send" | "osc777" | "none";

export async function paneTitle(): Promise<string | undefined> {
	if (!isTmuxTerminal()) return undefined;
	const pane = process.env.TMUX_PANE;
	const args = ["display-message", "-p", ...(pane && /^%\d+$/.test(pane) ? ["-t", pane] : []), "#{pane_title}"];
	try {
		const { stdout } = await runFile("tmux", args, { timeout: 1_000, maxBuffer: 4_096 });
		return stdout.trim() || undefined;
	} catch {
		return undefined;
	}
}

export async function deliverNotification(message: NotificationMessage, allowOsc: boolean): Promise<Delivery> {
	try {
		await runFile("notify-send", [
			"--app-name=Pi", "--icon=utilities-terminal", "--expire-time=8000", "--transient", "--",
			message.title, message.body,
		], { timeout: 3_000, maxBuffer: 4_096 });
		return "notify-send";
	} catch {
		if (!allowOsc) return "none";
		writeToTerminal(wrapForTmux(osc777(message.title, message.body)));
		return "osc777";
	}
}

function osc777(title: string, body: string): string {
	return `${ESC}]777;notify;${sanitizeField(title)};${sanitizeField(body)}${BEL}`;
}

function wrapForTmux(sequence: string): string {
	if (!isTmuxTerminal()) return sequence;
	return `${ESC}Ptmux;${sequence.replaceAll(ESC, `${ESC}${ESC}`)}${ESC}\\`;
}

function isTmuxTerminal(): boolean {
	return Boolean(process.env.TMUX || process.env.TMUX_PANE || process.env.TERM?.startsWith("tmux"));
}

function sanitizeField(value: string): string {
	return value.replace(/[\x00-\x1f\x7f\x9c]/g, " ").replace(/;/g, ",").trim();
}

function writeToTerminal(sequence: string): void {
	let fd: number | undefined;
	try {
		fd = openSync("/dev/tty", "w");
		writeSync(fd, sequence);
	} catch {
		process.stdout.write(sequence);
	} finally {
		if (fd !== undefined) closeSync(fd);
	}
}
