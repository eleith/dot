return {
	"nvim-treesitter/nvim-treesitter",
	build = ":TSUpdate",
	event = "BufReadPost",
	opts = {
		ensure_installed = {
			"bash",
			"c",
			"css",
			"fish",
			"go",
			"graphql",
			"html",
			"java",
			"javascript",
			"lua",
			"php",
			"python",
			"regex",
			"toml",
			"tsx",
			"typescript",
			"yaml",
			"comment",
			"prisma",
			"markdown",
			"ruby",
			"svelte",
		},
		indent = {
			enable = true,
		},
		context_commentstring = {
			enable = true,
			enable_autocmd = false,
		},
		incremental_selection = {
			enable = true,
			keymaps = {
				init_selection = "<C-space>",
				node_incremental = "<C-space>",
				scope_incremental = "<nop>",
				node_decremental = "<bs>",
			},
		},
		highlight = {
			enable = true,
			disable = function(_, buf)
				return vim.api.nvim_buf_line_count(buf) > 50000
			end,
		},
	},
	config = function(_, opts)
		require("nvim-treesitter.configs").setup(opts)
		vim.treesitter.language.register("html", "eta")
		vim.filetype.add({ extension = { eta = "eta" }})
	end,
}
