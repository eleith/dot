return {
	"miikanissi/modus-themes.nvim",
	priority = 1000,
	config = function()
		require("modus-themes").setup({
			style = "auto", -- auto switches based on vim.o.background
			variants = {
				modus_operandi = 'tinted',
				modus_vivendi = 'tinted',
			},
			transparent = false,
			styles = {
				comments = { italic = true },
				keywords = { italic = false },
			},
			on_highlights = function(hl, c)
				hl.NormalFloat = { fg = c.fg_main, bg = c.bg_main }
				hl.FloatBorder = { fg = c.fg_dim, bg = c.bg_main }
				hl.FloatTitle = { fg = c.fg_main, bg = c.bg_main }
			end,
		})
		vim.cmd("colorscheme modus")
	end,
}
