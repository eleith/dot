import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import compactEditorChrome from "./compact-editor-chrome/index.ts";
import notifications from "./notifications/index.ts";
import titleStatus from "./title-status/index.ts";
import toolRendering from "./tool-rendering/index.ts";
import { isToolChromeEnabled, setToolChromeEnabled, toggleToolChromeEnabled } from "./tool-rendering/state.ts";

export default function eleith(pi: ExtensionAPI): void {
	const promptStatus = compactEditorChrome(pi);
	toolRendering(pi);
	const desktopNotifications = notifications(pi);
	const terminalTitle = titleStatus(pi);

	pi.registerCommand("eleith", {
		description: "Control Eleith personal extensions",
		handler: async (args, ctx) => {
			const [area, action = "toggle"] = args.trim().toLowerCase().split(/\s+/).filter(Boolean);

			if (!area || area === "help") {
				showHelp(ctx);
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
		"/eleith notifications on|off|test|toggle",
		"/eleith compact-editor-chrome show|hide|toggle",
		"/eleith title-status show|hide|toggle",
		"/eleith tool-rendering show|hide|toggle",
	].join("\n"), "info");
}
