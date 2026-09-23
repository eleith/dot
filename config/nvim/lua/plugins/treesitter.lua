return {
	"nvim-treesitter/nvim-treesitter",
	branch = "main", -- Forces the rewrite branch
	build = ":TSUpdate",
	lazy = false,
	dependencies = {
		"nvim-treesitter/nvim-treesitter-textobjects",
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

		-- Install missing parsers from the list above; already installed ones are skipped.
		require("nvim-treesitter").install(languages)

		-- Enable the two features you currently use.
		vim.api.nvim_create_autocmd("FileType", {
			group = vim.api.nvim_create_augroup("treesitter.setup", { clear = true }),
			callback = function(args)
				local language = vim.treesitter.language.get_lang(args.match) or args.match
				if not vim.treesitter.language.add(language) then
					return -- No parser installed for this filetype.
				end

				vim.treesitter.start(args.buf, language)
				vim.bo[args.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
			end,
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
