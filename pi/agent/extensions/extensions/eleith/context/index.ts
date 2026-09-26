import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { completeContext, ContextController } from "./controller.ts";

export default function contextWindow(pi: ExtensionAPI): ContextController {
	const controller = new ContextController(pi);

	pi.on("session_start", (_event, ctx) => controller.restore(ctx));
	pi.on("session_tree", (_event, ctx) => controller.restore(ctx));
	pi.on("model_select", (_event, ctx) => controller.modelSelected(ctx));
	pi.on("session_shutdown", () => controller.shutdown());
	pi.on("input", async (event, ctx) => {
		// Reconcile before Pi's pre-prompt compaction check. A catalog refresh or
		// reselecting the same model can replace our copy without model_select.
		if (event.streamingBehavior === undefined && ctx.isIdle()) await controller.reconcile(ctx);
	});
	pi.on("before_agent_start", (_event, ctx) => controller.reconcile(ctx));

	pi.registerCommand("context-window", {
		description: "Show context status, extend the window, or restore the standard window",
		getArgumentCompletions: completeContext,
		handler: (args, ctx) => controller.handle(args, ctx),
	});

	return controller;
}
