return {
	"nvim-telescope/telescope.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
	},
	config = function()
		local telescope = require("telescope")
		local actions = require("telescope.actions")
		local layout = require("telescope.actions.layout")

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

		vim.api.nvim_set_keymap(
			"n",
			"<space>ff",
			[[<Cmd>lua require('telescope.builtin').find_files()<CR>]],
			{ noremap = true, silent = true }
		)

		vim.api.nvim_set_keymap(
			"n",
			"<space>ft",
			[[<Cmd>lua require('telescope.builtin').treesitter()<CR>]],
			{ noremap = true, silent = true }
		)

		vim.api.nvim_set_keymap(
			"n",
			"<space>fg",
			[[<Cmd>lua require('telescope.builtin').live_grep()<CR>]],
			{ noremap = true, silent = true }
		)

		vim.api.nvim_set_keymap(
			"n",
			"<space>fb",
			[[<Cmd>lua require('telescope.builtin').buffers()<CR>]],
			{ noremap = true, silent = true }
		)
	end,
}
