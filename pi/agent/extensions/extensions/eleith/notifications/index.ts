import type { AgentActivityOutcome, ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { completionMessage, notificationTitle } from "./message.ts";
import { deliverNotification, paneTitle, type Delivery } from "./transports.ts";

const DEFAULT_MIN_DURATION_MS = 15_000;

export class DesktopNotifier {
	private enabled = true;
	private runStartedAt: number | undefined;
	private outcome: AgentActivityOutcome | undefined;
	private readonly minDurationMs: number;

	constructor(minDurationMs = DEFAULT_MIN_DURATION_MS) {
		this.minDurationMs = minDurationMs;
	}

	register(pi: ExtensionAPI): void {
		pi.on("agent_start", () => {
			// Continuations are part of the same run until agent_settled.
			this.runStartedAt ??= Date.now();
			this.outcome = undefined;
		});

		pi.on("agent_before_settle", (event) => {
			this.outcome = event.outcome;
		});

		pi.on("agent_settled", async (_event, ctx) => {
			const elapsedMs = this.runStartedAt === undefined ? 0 : Math.max(0, Date.now() - this.runStartedAt);
			const outcome = this.outcome;
			this.resetRun();
			if (!this.enabled || ctx.mode !== "tui") return;
			if (outcome !== "aborted" && outcome !== "error" && elapsedMs < this.minDurationMs) return;

			const title = notificationTitle(await paneTitle(), ctx.cwd, ctx.sessionManager.getSessionName());
			await deliverNotification(completionMessage(title, outcome, elapsedMs), true);
		});

		pi.on("session_shutdown", () => this.resetRun());
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
	}

	toggle(): boolean {
		this.enabled = !this.enabled;
		return this.enabled;
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	async test(cwd: string, sessionName?: string): Promise<Delivery> {
		const title = notificationTitle(await paneTitle(), cwd, sessionName);
		return deliverNotification({ title, body: "Pi notification test" }, true);
	}

	private resetRun(): void {
		this.runStartedAt = undefined;
		this.outcome = undefined;
	}
}

export default function notifications(pi: ExtensionAPI): DesktopNotifier {
	const notifier = new DesktopNotifier();
	notifier.register(pi);
	return notifier;
}
