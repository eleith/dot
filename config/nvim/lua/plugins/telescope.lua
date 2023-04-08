return {
	"nvim-telescope/telescope.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	config = function()
		local telescope = require("telescope")
		local actions = require("telescope.actions")
		local layout = require("telescope.actions.layout")
		local builtin = require("telescope.builtin")

		telescope.setup({
			defaults = {
				file_ignore_patterns = { "node_modules" },
				preview = { hide_on_startup = true },
				mappings = {
					n = {
						["<C-p>"] = layout.toggle_preview,
					},
					i = {
						["<C-p>"] = layout.toggle_preview,
						["<esc>"] = actions.close,
					},
				},
			},
		})

		vim.keymap.set("n", "<leader>ff", builtin.find_files, { noremap = true, silent = true })
		vim.keymap.set("n", "<leader>ft", builtin.treesitter, { noremap = true, silent = true })
		vim.keymap.set("n", "<leader>fg", builtin.live_grep, { noremap = true, silent = true })
		vim.keymap.set("n", "<leader>fb", builtin.buffers, { noremap = true, silent = true })
	end,
}
