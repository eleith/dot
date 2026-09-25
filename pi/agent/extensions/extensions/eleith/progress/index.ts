import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const ACTIVE = "\x1b]9;4;3\x07";
const START_AT_ZERO = "\x1b]9;4;1;0\x07";
const CLEAR = "\x1b]9;4;0\x07";
const TEST_DURATION_MS = 20_000;

function usesTmuxPassthrough(): boolean {
	// TMUX may be omitted by a launcher even though TERM still identifies tmux.
	return Boolean(process.env.TMUX) || /^tmux(?:-|$)/.test(process.env.TERM ?? "");
}

function writeProgress(sequence: string): void {
	const output = usesTmuxPassthrough()
		? `\x1bPtmux;${sequence.replaceAll("\x1b", "\x1b\x1b")}\x1b\\`
		: sequence;
	process.stdout.write(output);
}

export default function progress(pi: ExtensionAPI) {
	let enabled = true;
	let working = false;
	let keepalive: ReturnType<typeof setInterval> | undefined;
	let testTimeout: ReturnType<typeof setTimeout> | undefined;

	function transport(): string {
		return usesTmuxPassthrough() ? "tmux passthrough" : "direct OSC 9;4";
	}

	function stop(): void {
		const active = keepalive !== undefined || testTimeout !== undefined;
		if (keepalive) clearInterval(keepalive);
		if (testTimeout) clearTimeout(testTimeout);
		keepalive = undefined;
		testTimeout = undefined;
		if (active) writeProgress(CLEAR);
	}

	function start(): void {
		if (keepalive) return;
		// A single determinate frame may reset the animation's starting position.
		writeProgress(START_AT_ZERO);
		writeProgress(ACTIVE);
		keepalive = setInterval(() => writeProgress(ACTIVE), 1_000);
	}

	function setEnabled(next: boolean): void {
		enabled = next;
		if (!enabled) stop();
		else if (working) start();
	}

	pi.on("session_start", () => {
		stop();
		working = false;
	});
	pi.on("agent_start", (_event, ctx) => {
		if (ctx.mode !== "tui") return;
		working = true;
		if (testTimeout) stop();
		if (enabled) start();
	});
	pi.on("agent_end", () => {
		working = false;
		stop();
	});
	pi.on("session_shutdown", () => {
		working = false;
		stop();
	});

	return {
		isEnabled: () => enabled,
		transport,
		setEnabled,
		toggle(): boolean {
			setEnabled(!enabled);
			return enabled;
		},
		test(ctx: ExtensionContext): void {
			if (ctx.mode !== "tui") {
				ctx.ui.notify("Terminal progress test requires interactive Pi", "warning");
				return;
			}
			if (working) {
				ctx.ui.notify("Wait for the current agent run to finish before testing progress", "warning");
				return;
			}
			stop();
			start();
			testTimeout = setTimeout(() => {
				stop();
				ctx.ui.notify("Terminal progress test finished", "info");
			}, TEST_DURATION_MS);
			ctx.ui.notify(`Testing ${transport()} for ${TEST_DURATION_MS / 1_000} seconds`, "info");
		},
	};
}
