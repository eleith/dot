-- Pull in the wezterm API
local wezterm = require("wezterm")
local config = wezterm.config_builder()

local function get_appearance()
	if wezterm.gui then
		return wezterm.gui.get_appearance()
	end
	return "Dark"
end

local function scheme_for_appearance(appearance)
	if appearance:find("Dark") then
		return "Gruvbox dark, medium (base16)"
	else
		return "Gruvbox light, medium (base16)"
	end
end

local function sync_tmux_theme(appearance)
	local conf = (wezterm.home_dir .. "/.config/tmux/tmux.conf")

	local has_tmux = wezterm.run_child_process({
		"flatpak-spawn",
		"--host",
		"tmux",
		"has-session"
	})

	-- If tmux isn't running, exit quietly without throwing an error
	if not has_tmux then
		return
	end

	local success, stdout, stderr = wezterm.run_child_process({
		"flatpak-spawn",
		"--host",
		"tmux",
		"source-file",
		conf
	})

	if not success then
		wezterm.log_error("Failed to sync tmux theme: " .. tostring(stderr))
	end
end

wezterm.on("window-config-reloaded", function(window, pane)
	sync_tmux_theme(window:get_appearance())
end)

config.color_scheme = scheme_for_appearance(get_appearance())
config.hide_tab_bar_if_only_one_tab = true
config.adjust_window_size_when_changing_font_size = false
config.window_decorations = "RESIZE"
config.warn_about_missing_glyphs = false

-- disable audio bell
-- config.audible_bell = "Disabled"
config.audible_bell = "SystemBeep"

-- 2. Hook into the bell event to play a sound manually
wezterm.on('bell', function(window, pane)
	-- Run the audio player in the background so it doesn't freeze the terminal
	wezterm.background_child_process {
		'flatpak-spawn',
		'--host',
		"pw-play",
		"/usr/share/sounds/freedesktop/stereo/bell.oga" -- Replace with your tested path
	}
end)

config.visual_bell = {
	fade_in_function = 'EaseIn',
	fade_in_duration_ms = 150,
	fade_out_function = 'EaseOut',
	fade_out_duration_ms = 150,
}
config.colors = {
	visual_bell = '#202020',
}

-- disable update check

config.check_for_updates = false

return config
