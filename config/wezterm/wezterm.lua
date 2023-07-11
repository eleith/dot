-- Pull in the wezterm API
local wezterm = require("wezterm")
local config = wezterm.config_builder()

function get_appearance()
	if wezterm.gui then
		return wezterm.gui.get_appearance()
	end
	return "Dark"
end

function scheme_for_appearance(appearance)
	if appearance:find("Dark") then
		return "Gruvbox dark, medium (base16)"
	else
		return "Gruvbox light, medium (base16)"
	end
end

config.color_scheme = scheme_for_appearance(get_appearance())
config.font = wezterm.font("JetBrainsMono Nerd Font")
config.font_size = 12.0
config.hide_tab_bar_if_only_one_tab = true
config.adjust_window_size_when_changing_font_size = false
config.window_decorations = "RESIZE"

-- disable audio bell

config.audible_bell = "Disabled"
config.visual_bell = {
  fade_in_function = 'EaseIn',
  fade_in_duration_ms = 150,
  fade_out_function = 'EaseOut',
  fade_out_duration_ms = 150,
}
config.colors = {
  visual_bell = '#202020',
}


return config
