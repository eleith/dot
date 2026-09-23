import type {
	ExtensionAPI,
	ExtensionContext,
	ReadonlyFooterDataProvider,
	Theme,
} from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth, type Component, type TUI } from "@earendil-works/pi-tui";
import { bottomLeftStatus, topRightStatus } from "./format.ts";
import { GitStatusPoller } from "./git.ts";
import type { ChromeSnapshot } from "./types.ts";

const TOP_WIDGET = "eleith-prompt-status-top";
const BOTTOM_WIDGET = "eleith-prompt-status-bottom";

class EmptyFooter implements Component {
	render(): string[] { return []; }
	invalidate(): void {}
}

class PromptStatusWidget implements Component {
	constructor(
		private readonly getSnapshot: () => ChromeSnapshot | undefined,
		private readonly onRender: () => void,
		private readonly placement: "top" | "bottom",
		private readonly theme: Theme,
	) {}

	render(width: number): string[] {
		this.onRender();
		const snapshot = this.getSnapshot();
		if (!snapshot) return [];

		const separator = this.theme.fg("borderMuted", "───");
		const text = this.placement === "top"
			? topRightStatus(snapshot.ctx, this.theme, separator)
			: bottomLeftStatus(
				snapshot.ctx,
				snapshot.footerData?.getExtensionStatuses(),
				snapshot.footerData?.getGitBranch() ?? null,
				snapshot.gitStatus,
				this.theme,
				separator,
			);

		return [this.placement === "top" ? alignRight(text, width) : truncateToWidth(text, width, "…")];
	}

	invalidate(): void {}
}

export class CompactEditorChromeController {
	private enabled = true;
	private tui: TUI | undefined;
	private ctx: ExtensionContext | undefined;
	private footerData: ReadonlyFooterDataProvider | undefined;
	private disposeFooterBranchListener: (() => void) | undefined;
	private readonly git = new GitStatusPoller(() => this.requestRender());

	constructor(private readonly pi: ExtensionAPI) {}

	register(): void {
		this.pi.on("session_start", (_event, ctx) => {
			if (this.enabled) this.install(ctx);
		});

		this.pi.on("model_select", (_event, ctx) => this.updateContext(ctx));
		this.pi.on("thinking_level_select", (_event, ctx) => this.updateContext(ctx));
		this.pi.on("agent_start", () => this.requestRender());
		this.pi.on("agent_settled", () => this.requestRender());
		this.pi.on("session_shutdown", () => this.resetSessionState());
	}

	private install(ctx: ExtensionContext): void {
		this.ctx = ctx;
		ctx.ui.setWorkingVisible(true);
		ctx.ui.setFooter((tui, _theme, footerData) => {
			this.tui = tui;
			this.footerData = footerData;
			this.disposeFooterBranchListener?.();
			this.disposeFooterBranchListener = footerData.onBranchChange(() => {
				this.git.invalidate();
				this.git.refresh(ctx.cwd);
				this.requestRender();
			});

			return new EmptyFooterWithDispose(() => this.disposeFooterBranchListener?.());
		});

		ctx.ui.setWidget(TOP_WIDGET, (tui, theme) => {
			this.tui = tui;
			return new PromptStatusWidget(() => this.snapshot(), () => this.refreshGit(), "top", theme);
		});
		ctx.ui.setWidget(BOTTOM_WIDGET, (tui, theme) => {
			this.tui = tui;
			return new PromptStatusWidget(() => this.snapshot(), () => this.refreshGit(), "bottom", theme);
		}, { placement: "belowEditor" });
	}

	private uninstall(ctx: ExtensionContext): void {
		this.disposeFooterBranchListener?.();
		this.disposeFooterBranchListener = undefined;
		ctx.ui.setWorkingVisible(true);
		ctx.ui.setFooter(undefined);
		ctx.ui.setWidget(TOP_WIDGET, undefined);
		ctx.ui.setWidget(BOTTOM_WIDGET, undefined, { placement: "belowEditor" });
	}

	show(ctx: ExtensionContext): void {
		this.enabled = true;
		this.install(ctx);
	}

	hide(ctx: ExtensionContext): void {
		this.enabled = false;
		this.uninstall(ctx);
	}

	toggle(ctx: ExtensionContext): boolean {
		if (this.enabled) this.hide(ctx);
		else this.show(ctx);
		return this.enabled;
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	private updateContext(ctx: ExtensionContext): void {
		this.ctx = ctx;
		this.requestRender();
	}

	private snapshot(): ChromeSnapshot | undefined {
		if (!this.ctx) return undefined;
		return {
			ctx: this.ctx,
			footerData: this.footerData,
			gitStatus: this.git.snapshot(),
		};
	}

	private refreshGit(): void {
		if (this.ctx) this.git.refresh(this.ctx.cwd);
	}

	private requestRender(): void {
		this.tui?.requestRender();
	}

	private resetSessionState(): void {
		this.disposeFooterBranchListener?.();
		this.disposeFooterBranchListener = undefined;
		this.tui = undefined;
		this.ctx = undefined;
		this.footerData = undefined;
	}
}

class EmptyFooterWithDispose extends EmptyFooter {
	constructor(private readonly onDispose: () => void) { super(); }
	dispose(): void { this.onDispose(); }
}

function alignRight(text: string, width: number): string {
	const fitted = truncateToWidth(text, width, "…");
	return `${" ".repeat(Math.max(0, width - visibleWidth(fitted)))}${fitted}`;
}

export default function compactEditorChrome(pi: ExtensionAPI): CompactEditorChromeController {
	const controller = new CompactEditorChromeController(pi);
	controller.register();
	return controller;
}
