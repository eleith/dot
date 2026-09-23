import { basename } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const SPINNER_FRAMES = ["◰", "◳", "◲", "◱"] as const;
const SPINNER_INTERVAL_MS = 300;
const IDLE_ICON = "π";

// Titles are sent in an OSC escape sequence; never include terminal controls from a session name.
function safeLabel(value: string): string {
	return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
}

export default function titleStatus(pi: ExtensionAPI) {
	let enabled = true;
	let working = false;
	let spinner: ReturnType<typeof setInterval> | undefined;
	let pendingRender: ReturnType<typeof setImmediate> | undefined;
	let frameIndex = 0;

	function sessionName(): string {
		return safeLabel(pi.getSessionName() ?? "");
	}

	function folder(ctx: ExtensionContext): string {
		return safeLabel(basename(ctx.cwd)) || "pi";
	}

	function render(ctx: ExtensionContext): void {
		if (ctx.mode !== "tui") return;
		const icon = spinner
			? (SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length] ?? SPINNER_FRAMES[0])
			: IDLE_ICON;
		ctx.ui.setTitle(`${icon} - ${sessionName() || folder(ctx)}`);
	}

	function restorePiTitle(ctx: ExtensionContext): void {
		if (ctx.mode !== "tui") return;
		const name = sessionName();
		ctx.ui.setTitle(name ? `π - ${name} - ${folder(ctx)}` : `π - ${folder(ctx)}`);
	}

	function stop(): void {
		if (spinner) clearInterval(spinner);
		if (pendingRender) clearImmediate(pendingRender);
		spinner = undefined;
		pendingRender = undefined;
		frameIndex = 0;
	}

	function startSpinner(ctx: ExtensionContext): void {
		if (!enabled || ctx.mode !== "tui" || spinner) return;
		spinner = setInterval(() => {
			frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
			render(ctx);
		}, SPINNER_INTERVAL_MS);
		spinner.unref();
		render(ctx);
	}

	// Pi writes its own title after session startup and when the session is renamed.
	function renderAfterPi(ctx: ExtensionContext): void {
		if (!enabled || ctx.mode !== "tui") return;
		if (pendingRender) clearImmediate(pendingRender);
		pendingRender = setImmediate(() => {
			pendingRender = undefined;
			if (enabled) render(ctx);
		});
	}

	function show(ctx: ExtensionContext): void {
		enabled = true;
		stop();
		if (working) startSpinner(ctx);
		else render(ctx);
	}

	function hide(ctx: ExtensionContext): void {
		enabled = false;
		stop();
		restorePiTitle(ctx);
	}

	pi.on("session_start", (_event, ctx) => {
		working = false;
		stop();
		renderAfterPi(ctx);
	});
	pi.on("session_info_changed", (_event, ctx) => renderAfterPi(ctx));
	pi.on("agent_start", (_event, ctx) => {
		working = true;
		startSpinner(ctx);
	});
	pi.on("agent_settled", (_event, ctx) => {
		working = false;
		stop();
		if (enabled) render(ctx);
	});
	pi.on("session_shutdown", (_event, ctx) => {
		working = false;
		stop();
		if (enabled) render(ctx);
	});

	return {
		show,
		hide,
		toggle(ctx: ExtensionContext): boolean {
			if (enabled) hide(ctx);
			else show(ctx);
			return enabled;
		},
		isEnabled: (): boolean => enabled,
	};
}
