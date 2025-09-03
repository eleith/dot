return {
	"lewis6991/gitsigns.nvim",
	lazy = true,
	event = { "BufReadPre", "BufNewFile" },
	opts = {
		signs = {
			add = { text = "+" },
			delete = { text = "-" },
		},
		signs_staged = {
			add = { text = "+" },
			delete = { text = "-" },
		},
	},
}
