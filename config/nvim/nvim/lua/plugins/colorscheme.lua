return {
	"ellisonleao/gruvbox.nvim",
	lazy = false,
	priority = 1000,
	config = function()
		local gruvbox = require("gruvbox")
		local palette = require("gruvbox.palette")

		gruvbox.setup({
			overrides = {
				NormalFloat = { bg = palette.bg0 },
				CmpNormal = { bg = palette.bg0 },
			},
		})

		vim.cmd.colorscheme("gruvbox")
	end,
}
