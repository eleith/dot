import { execFileSync } from "node:child_process";
import { basename, sep } from "node:path";
import { homedir } from "node:os";
import {
  VERSION,
  getAgentDir,
  loadProjectContextFiles,
  type ExtensionAPI,
  type ExtensionContext,
  type Theme,
} from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth, type Component } from "@earendil-works/pi-tui";
import { PALETTE, SMALL_TREE, TINY_TREE, TREE } from "./tree-data.ts";
import { styleThinking } from "../compact-editor-chrome/format.ts";

const ENTRY_TYPE = "eleith-startup-tree";
const GAP = 3;
const PAD = 2;
const MIN_INFO_WIDTH = 40;
const LARGE_TREE_WIDTH = 48;
const SMALL_TREE_WIDTH = 30;
const TINY_TREE_WIDTH = 20;
type GetExtensionStatuses = () => ReadonlyMap<string, string> | undefined;
type TreeSize = "auto" | "large" | "small" | "tiny";

interface WelcomeData {
  treeSize?: TreeSize;
  directory: string;
  branch?: string;
  session: string;
  model: string;
  contextWindow?: number;
  thinking?: ExtensionContext["thinkingLevel"];
  context: string;
  skills: string;
  prompts: string;
  tools: string;
}

/** Entries persist between sessions, so always sanitize text at the display boundary. */
function safe(text: string): string {
  return text.replace(/[\p{Cc}\p{Cf}]/gu, " ").replace(/\s+/gu, " ").trim();
}

function git(cwd: string, args: string[]): string | undefined {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      timeout: 700,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return undefined;
  }
}

function getBranchLabel(cwd: string): string | undefined {
  const branch = git(cwd, ["branch", "--show-current"]);
  if (!branch) return undefined;
  const changes = git(cwd, ["status", "--porcelain", "--untracked-files=no"]);
  return safe(branch + (changes ? " · modified" : ""));
}

function summarize(names: string[], prefix = ""): string {
  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b));
  if (!unique.length) return "0 found";
  const shown = unique.slice(0, 3).map((name) => prefix + safe(name));
  return shown.join(", ") + (unique.length > 3 ? ` +${unique.length - 3}` : "");
}

function collect(pi: ExtensionAPI, ctx: ExtensionContext): WelcomeData {
  const home = homedir();
  const directory = ctx.cwd === home || ctx.cwd.startsWith(home + sep)
    ? `~${ctx.cwd.slice(home.length)}`
    : ctx.cwd;
  const commands = pi.getCommands();
  let context = "0 found";
  try {
    context = summarize(loadProjectContextFiles({ cwd: ctx.cwd, agentDir: getAgentDir() })
      .map((file) => basename(file.path)));
  } catch { context = "unavailable"; }
  const allTools = pi.getAllTools().length;
  const activeTools = pi.getActiveTools().length;
  return {
    directory: safe(directory),
    branch: getBranchLabel(ctx.cwd),
    session: safe(ctx.sessionManager.getSessionName() || ""),
    model: safe(ctx.model ? `${ctx.model.provider} / ${ctx.model.id}` : "no model selected"),
    contextWindow: ctx.model?.contextWindow,
    thinking: ctx.thinkingLevel,
    context,
    skills: summarize(commands.filter((command) => command.source === "skill").map((command) => command.name)),
    prompts: summarize(commands.filter((command) => command.source === "prompt").map((command) => command.name), "/"),
    tools: `${activeTools} active / ${allTools} available`,
  };
}

/** Each Unicode half-block is one terminal column and two colored vertical pixels. */
function coloredTree(rows: readonly string[]): string[] {
  const color = (key: string) => PALETTE[key]?.slice(1).match(/../g)?.map((part) => parseInt(part, 16)).join(";");
  const result: string[] = [];
  for (let y = 0; y < rows.length; y += 2) {
    const upper = rows[y] ?? "";
    const lower = rows[y + 1] ?? "";
    let line = "";
    for (let x = 0; x < upper.length; x++) {
      const top = upper[x] ?? ".";
      const bottom = lower[x] ?? ".";
      if (top === "." && bottom === ".") line += " ";
      else if (top === bottom) line += `\x1b[38;2;${color(top)}m█\x1b[0m`;
      else if (bottom === ".") line += `\x1b[38;2;${color(top)}m▀\x1b[0m`;
      else if (top === ".") line += `\x1b[38;2;${color(bottom)}m▄\x1b[0m`;
      else line += `\x1b[38;2;${color(top)};48;2;${color(bottom)}m▀\x1b[0m`;
    }
    result.push(line.trimEnd());
  }
  return result;
}

const treeVariants = {
  large: { lines: coloredTree(TREE), width: LARGE_TREE_WIDTH },
  small: { lines: coloredTree(SMALL_TREE), width: SMALL_TREE_WIDTH },
  tiny: { lines: coloredTree(TINY_TREE), width: TINY_TREE_WIDTH },
} as const;

class WelcomeCard implements Component {
  constructor(private readonly data: WelcomeData, private readonly theme: Theme, private readonly getStatuses: GetExtensionStatuses) {}

  render(width: number): string[] {
    const w = Math.max(1, width);
    const t = this.theme;
    if (w < PAD * 2 + 1) return [truncateToWidth(t.fg("accent", "pi"), w, "")];

    const usable = w - PAD * 2;
    const edge = " ".repeat(PAD);
    const heading = (text: string) => t.fg("mdHeading", `[ ${text} ]`);
    const fact = (label: string, value: string) => t.fg("muted", label.padEnd(9)) + t.fg("text", safe(value === "—" ? "0 found" : value));
    const sandboxStatus = this.getStatuses()?.get("nono");
    const session = this.data.session && !["new session", "unnamed session"].includes(this.data.session)
      ? this.data.session : undefined;
    const workspaceInfo = [this.data.branch, sandboxStatus, session]
      .filter((value): value is string => Boolean(value)).map(safe).join("  ·  ");
    const thinking = this.data.thinking ?? "off";
    const detail = [
      heading("Workspace"),
      t.fg("text", safe(this.data.directory)),
      ...(workspaceInfo ? [t.fg("muted", workspaceInfo)] : []),
      "",
      heading("Provider"),
      t.fg("text", safe(this.data.model)),
      styleThinking(t, thinking, safe(thinking)) + t.fg("muted", ` thinking${this.data.contextWindow ? `  ·  ${Math.round(this.data.contextWindow / 1000)}k context` : ""}`),
      "",
      heading("Resources"),
      fact("Agents", this.data.context),
      fact("Skills", this.data.skills),
      fact("Prompts", this.data.prompts),
      fact("Tools", this.data.tools),
      "",
      t.fg("dim", "Type / for commands  ·  ! for shell"),
    ];
    const fit = (text: string, max: number) => truncateToWidth(text, Math.max(1, max), "…");
    const pad = (text: string, max: number) => text + " ".repeat(Math.max(0, max - visibleWidth(text)));
    const title = ` pi / v${VERSION} `;
    const shortTitle = " pi ";
    const label = w >= visibleWidth(title) + 4 ? title
      : w >= visibleWidth(shortTitle) + 2 ? shortTitle : "";
    const leftRule = label ? 2 : 0;
    const topBar = t.fg("borderAccent", "─".repeat(leftRule))
      + t.bold(t.fg("accent", label)) + t.fg("borderAccent", "─".repeat(w - leftRule - visibleWidth(label)));
    const bottomBar = t.fg("borderAccent", "─".repeat(w));

    // The usual 80-column screen gets a compact side-by-side card, not a tall stack.
    const autoSize = usable >= LARGE_TREE_WIDTH + GAP + MIN_INFO_WIDTH ? "large"
      : usable >= SMALL_TREE_WIDTH ? "small"
      : usable >= TINY_TREE_WIDTH ? "tiny" : undefined;
    const preferred = this.data.treeSize && this.data.treeSize !== "auto"
      ? treeVariants[this.data.treeSize] : undefined;
    const selected = preferred && preferred.width <= usable
      ? preferred : autoSize ? treeVariants[autoSize] : undefined;
    const tree = selected?.lines;
    const treeWidth = selected?.width ?? 0;
    if (tree && usable >= treeWidth + GAP + MIN_INFO_WIDTH) {
      const infoWidth = usable - treeWidth - GAP;
      const height = Math.max(tree.length, detail.length);
      const treeOffset = Math.floor((height - tree.length) / 2);
      const detailOffset = Math.floor((height - detail.length) / 2);
      return [topBar, "", ...Array.from({ length: height }, (_, i) =>
        edge + pad(tree[i - treeOffset] ?? "", treeWidth)
          + " ".repeat(GAP) + fit(detail[i - detailOffset] ?? "", infoWidth)
      ), "", bottomBar];
    }

    return [
      topBar, "",
      ...(tree ? [
        ...tree.map((line) => " ".repeat(Math.floor((w - treeWidth) / 2)) + line),
        "",
      ] : []),
      ...detail.map((line) => edge + fit(line, usable)),
      "", bottomBar,
    ];
  }

  invalidate(): void {}
}

export default function welcome(pi: ExtensionAPI, getStatuses: GetExtensionStatuses): { show: (ctx: ExtensionContext, size?: TreeSize) => void } {
  pi.registerEntryRenderer<WelcomeData>(ENTRY_TYPE, (entry, _options, theme) => {
    if (!entry.data) return undefined;
    return new WelcomeCard(entry.data, theme, getStatuses);
  });

  const show = (ctx: ExtensionContext, size: TreeSize = "auto") => {
    if (ctx.mode !== "tui") return;
    pi.appendEntry(ENTRY_TYPE, { ...collect(pi, ctx), treeSize: size });
  };

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    // A resumed conversation keeps its original startup; /reload never adds a second card.
    const entries = ctx.sessionManager.getEntries();
    if (entries.some((entry) => entry.type === "custom" && entry.customType === ENTRY_TYPE)) return;
    if (ctx.sessionManager.getBranch().some((entry) => entry.type === "message")) return;
    show(ctx);
  });

  return { show };
}
