return {
	"folke/which-key.nvim",
	config = function()
		vim.o.timeout = true
		vim.o.timeoutlen = 600
		require("which-key").setup({
			window = {
				border = "single",
				position = "bottom",
			},
		})
	end,
}
