import { spawn, type ChildProcess } from "node:child_process";
import type { GitStatus } from "./types.ts";

const DEFAULT_TTL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 500;

export class GitStatusPoller {
	private status: GitStatus | null = null;
	private lastRefreshAt = 0;
	private generation = 0;
	private pending = false;
	private cwd: string | null = null;

	constructor(
		private readonly requestRender: () => void,
		private readonly ttlMs = DEFAULT_TTL_MS,
	) {}

	snapshot(): GitStatus | null {
		return this.status;
	}

	invalidate(): void {
		this.generation++;
		this.status = null;
		this.lastRefreshAt = 0;
	}

	refresh(cwd: string): void {
		if (this.cwd !== cwd) {
			this.cwd = cwd;
			this.status = null;
			this.invalidate();
		}

		if (this.pending || Date.now() - this.lastRefreshAt < this.ttlMs) return;
		this.pending = true;
		const requestedCwd = cwd;
		const requestedGeneration = this.generation;

		void readGitStatus(requestedCwd).then((status) => {
			if (this.cwd !== requestedCwd || this.generation !== requestedGeneration) return;
			this.status = status;
			this.lastRefreshAt = Date.now();
			this.requestRender();
		}).finally(() => {
			this.pending = false;
			// Discarded requests must not block the next directory or branch refresh.
			if (this.cwd && (this.cwd !== requestedCwd || this.generation !== requestedGeneration)) this.refresh(this.cwd);
		});
	}
}

function readGitStatus(cwd: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<GitStatus | null> {
	return new Promise((resolve) => {
		let child: ChildProcess;
		try {
			child = spawn("git", ["status", "--porcelain"], {
				cwd,
				stdio: ["ignore", "pipe", "ignore"],
				env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
			});
		} catch {
			resolve(null);
			return;
		}

		let stdout = "";
		let settled = false;
		const timer = setTimeout(() => {
			child.kill();
			settle(null);
		}, timeoutMs);

		const settle = (value: GitStatus | null) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve(value);
		};

		child.stdout?.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
		child.on("error", () => settle(null));
		child.on("close", (code) => settle(code === 0 ? parsePorcelainStatus(stdout) : null));
	});
}

function parsePorcelainStatus(output: string): GitStatus {
	let staged = 0;
	let unstaged = 0;
	let untracked = 0;

	for (const line of output.split("\n")) {
		if (!line) continue;
		const indexStatus = line[0];
		const worktreeStatus = line[1];

		if (indexStatus === "?" && worktreeStatus === "?") {
			untracked++;
			continue;
		}
		if (indexStatus && indexStatus !== " " && indexStatus !== "?") staged++;
		if (worktreeStatus && worktreeStatus !== " ") unstaged++;
	}

	return { staged, unstaged, untracked };
}
