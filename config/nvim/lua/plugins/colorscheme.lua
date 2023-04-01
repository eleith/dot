return {
	"ellisonleao/gruvbox.nvim",
	lazy = false,
	priority = 1000,
	config = function()
		local gruvbox = require("gruvbox")

		gruvbox.setup({
			overrides = {
				NormalFloat = { bg = "none" },
			},
		})

		vim.cmd.colorscheme("gruvbox")
	end,
}
