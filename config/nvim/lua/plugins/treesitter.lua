return {
	"nvim-treesitter/nvim-treesitter",
	branch = "main", -- Forces the rewrite branch
	build = ":TSUpdate",
	event = { "BufReadPre", "BufNewFile" },
	dependencies = {
		"nvim-treesitter/nvim-treesitter-textobjects",
		"MeanderingProgrammer/treesitter-modules.nvim",
	},
	config = function()
		local languages = {
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
			"markdown_inline",
			"ruby",
			"rust",
			"svelte",
			"toml",
		}

		-- Covers ensure_installed + highlight + indent + fold + incremental selection
		local ts = require("treesitter-modules")
		ts.setup({
			ensure_installed = languages,
			ignore_install = {},
			sync_install = false,
			auto_install = false,

			highlight = {
				enable = true,
			},
			indent = {
				enable = true,
			},
		})

		-- textobjects plugin now uses its own setup + keymaps
		require("nvim-treesitter-textobjects").setup({
			move = {
				set_jumps = false,
			},
			select = {
				lookahead = true,
			},
		})
	end,
}
