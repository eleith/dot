import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { completeEleith, registerEleithTabCompletion } from "./command-completion/index.ts";
import compactEditorChrome from "./compact-editor-chrome/index.ts";
import notifications from "./notifications/index.ts";
import progress from "./progress/index.ts";
import titleStatus from "./title-status/index.ts";
import toolRendering from "./tool-rendering/index.ts";
import welcome from "./welcome/index.ts";
import { isToolChromeEnabled, setToolChromeEnabled, toggleToolChromeEnabled } from "./tool-rendering/state.ts";

export default function eleith(pi: ExtensionAPI): void {
	registerEleithTabCompletion(pi);

	const promptStatus = compactEditorChrome(pi);
	toolRendering(pi);
	const desktopNotifications = notifications(pi);
	const terminalProgress = progress(pi);
	const terminalTitle = titleStatus(pi);
	const startupCard = welcome(pi, () => promptStatus.getExtensionStatuses());

	pi.registerCommand("eleith", {
		description: "Personal extensions — type /eleith followed by a space for options",
		getArgumentCompletions: completeEleith,
		handler: async (args, ctx) => {
			const parts = args.trim().toLowerCase().split(/\s+/).filter(Boolean);
			if (parts.length > 2) return showHelp(ctx);
			const [area, explicitAction] = parts;
			const action = explicitAction ?? "toggle";

			if (!area || area === "help") {
				showHelp(ctx);
				return;
			}

			if (area === "welcome") {
				if (explicitAction === "large" || explicitAction === "small" || explicitAction === "tiny") {
					startupCard.show(ctx, explicitAction);
				} else if (!explicitAction || explicitAction === "show" || explicitAction === "auto") {
					startupCard.show(ctx);
				} else {
					return showHelp(ctx);
				}
				return;
			}

			if (area === "notifications") {
				if (action === "on") desktopNotifications.setEnabled(true);
				else if (action === "off") desktopNotifications.setEnabled(false);
				else if (action === "test") {
					const delivery = await desktopNotifications.test(ctx.cwd, ctx.sessionManager.getSessionName());
					ctx.ui.notify(`Pi notification test: ${delivery}`, delivery === "none" ? "warning" : "info");
					return;
				}
				else if (action === "toggle") desktopNotifications.toggle();
				else return showHelp(ctx);

				ctx.ui.notify(`Eleith notifications: ${desktopNotifications.isEnabled() ? "on" : "off"}`, "info");
				return;
			}

			if (area === "progress") {
				if (action === "test") {
					terminalProgress.test(ctx);
					return;
				}
				if (action === "on") terminalProgress.setEnabled(true);
				else if (action === "off") terminalProgress.setEnabled(false);
				else if (action === "toggle") terminalProgress.toggle();
				else return showHelp(ctx);

				ctx.ui.notify(`Eleith terminal progress: ${terminalProgress.isEnabled() ? "on" : "off"} (${terminalProgress.transport()})`, "info");
				return;
			}

			if (area === "compact-editor-chrome") {
				if (action === "show") promptStatus.show(ctx);
				else if (action === "hide") promptStatus.hide(ctx);
				else if (action === "toggle") promptStatus.toggle(ctx);
				else return showHelp(ctx);

				ctx.ui.notify(`Eleith compact editor chrome: ${promptStatus.isEnabled() ? "shown" : "hidden"}`, "info");
				return;
			}

			if (area === "title-status") {
				if (action === "show") terminalTitle.show(ctx);
				else if (action === "hide") terminalTitle.hide(ctx);
				else if (action === "toggle") terminalTitle.toggle(ctx);
				else return showHelp(ctx);

				ctx.ui.notify(`Eleith title status: ${terminalTitle.isEnabled() ? "shown" : "hidden"}`, "info");
				return;
			}

			if (area === "tool-rendering") {
				if (action === "show") setToolChromeEnabled(true);
				else if (action === "hide") setToolChromeEnabled(false);
				else if (action === "toggle") toggleToolChromeEnabled();
				else return showHelp(ctx);

				ctx.ui.notify(`Eleith tool rendering chrome: ${isToolChromeEnabled() ? "shown" : "hidden"}`, "info");
				return;
			}

			showHelp(ctx);
		},
	});
}

function showHelp(ctx: ExtensionCommandContext): void {
	ctx.ui.notify([
		"Usage:",
		"/eleith welcome [auto|large|small|tiny]  —  show a tree size",
		"/eleith notifications on|off|test|toggle",
		"/eleith progress on|off|test|toggle",
		"/eleith compact-editor-chrome show|hide|toggle",
		"/eleith title-status show|hide|toggle",
		"/eleith tool-rendering show|hide|toggle",
	].join("\n"), "info");
}
