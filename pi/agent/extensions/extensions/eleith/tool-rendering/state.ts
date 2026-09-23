let toolChromeEnabled = true;

export function isToolChromeEnabled(): boolean {
	return toolChromeEnabled;
}

export function setToolChromeEnabled(enabled: boolean): void {
	toolChromeEnabled = enabled;
}

export function toggleToolChromeEnabled(): boolean {
	toolChromeEnabled = !toolChromeEnabled;
	return toolChromeEnabled;
}
