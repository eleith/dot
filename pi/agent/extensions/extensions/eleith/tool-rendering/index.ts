import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerBashRendering } from "./bash.ts";
import { registerEditRendering } from "./edit.ts";
import { registerFindRendering } from "./find.ts";
import { registerGrepRendering } from "./grep.ts";
import { registerLsRendering } from "./ls.ts";
import { registerReadRendering } from "./read.ts";
import { registerWriteRendering } from "./write.ts";
import { WorkingTimeTracker, workingMessage } from "./working-time.ts";

export default function toolRendering(pi: ExtensionAPI): void {
	const cwd = process.cwd();
	registerWorkingTimer(pi);
	registerBashRendering(pi, cwd);
	registerReadRendering(pi, cwd);
	registerGrepRendering(pi, cwd);
	registerLsRendering(pi, cwd);
	registerFindRendering(pi, cwd);
	registerWriteRendering(pi, cwd);
	registerEditRendering(pi, cwd);
}

function registerWorkingTimer(pi: ExtensionAPI): void {
	const tracker = new WorkingTimeTracker();
	let tick: ReturnType<typeof setInterval> | undefined;

	const stopTick = (): void => {
		if (tick !== undefined) clearInterval(tick);
		tick = undefined;
	};

	pi.on("before_agent_start", () => {
		tracker.beginRun();
	});

	pi.on("agent_start", () => {
		tracker.ensureRun();
	});

	pi.on("before_provider_request", (_event, ctx) => {
		tracker.beginModelSegment();
		stopTick();
		if (ctx.hasUI) {
			const update = () => ctx.ui.setWorkingMessage(workingMessage(tracker.modelMs()));
			update();
			tick = setInterval(update, 1000);
		}
	});

	pi.on("message_end", (event) => {
		if (event.message.role !== "assistant") return;
		tracker.endModelSegment();
		stopTick();
	});

	pi.on("agent_settled", (_event, ctx) => {
		stopTick();
		if (ctx.hasUI) ctx.ui.setWorkingMessage();
		tracker.settle();
	});

	pi.on("session_shutdown", () => {
		stopTick();
	});
}
