return {
	"jose-elias-alvarez/null-ls.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"lewis6991/gitsigns.nvim",
	},
	config = function()
		local null_ls = require("null-ls")

		local augroup = vim.api.nvim_create_augroup("LspFormatting", {})
		local async_formatting = function(bufnr)
			bufnr = bufnr or vim.api.nvim_get_current_buf()

			vim.lsp.buf_request(
				bufnr,
				"textDocument/formatting",
				vim.lsp.util.make_formatting_params({}),
				function(err, res, ctx)
					if err then
						local err_msg = type(err) == "string" and err or err.message
						-- you can modify the log message / level (or ignore it completely)
						vim.notify("formatting: " .. err_msg, vim.log.levels.WARN)
						return
					end

					-- don't apply results if buffer is unloaded or has been modified
					if not vim.api.nvim_buf_is_loaded(bufnr) or vim.api.nvim_buf_get_option(bufnr, "modified") then
						return
					end

					if res then
						local client = vim.lsp.get_client_by_id(ctx.client_id)
						vim.lsp.util.apply_text_edits(res, bufnr, client and client.offset_encoding or "utf-16")
						vim.api.nvim_buf_call(bufnr, function()
							vim.cmd("silent noautocmd update")
						end)
					end
				end
			)
		end

		null_ls.setup({
			on_attach = function(client, bufnr)
				if client.supports_method("textDocument/formatting") then
					vim.api.nvim_clear_autocmds({ group = augroup, buffer = bufnr })
					vim.api.nvim_create_autocmd("BufWritePre", {
						group = augroup,
						buffer = bufnr,
						callback = function()
							async_formatting(bufnr)
						end,
					})
				end
			end,
			border = "single",
			sources = {
				null_ls.builtins.formatting.stylua,
				null_ls.builtins.diagnostics.eslint,
				null_ls.builtins.completion.spell,
				null_ls.builtins.diagnostics.erb_lint,
				null_ls.builtins.code_actions.gitsigns,
				null_ls.builtins.code_actions.shellcheck,
				null_ls.builtins.diagnostics.actionlint,
				null_ls.builtins.diagnostics.buf,
				null_ls.builtins.diagnostics.checkmake,
				null_ls.builtins.diagnostics.codespell,
				null_ls.builtins.diagnostics.fish,
				null_ls.builtins.diagnostics.flake8,
				null_ls.builtins.diagnostics.golangci_lint,
				null_ls.builtins.diagnostics.jsonlint,
				null_ls.builtins.diagnostics.luacheck,
				null_ls.builtins.diagnostics.markdownlint,
				null_ls.builtins.formatting.markdownlint,
				null_ls.builtins.diagnostics.mypy,
				null_ls.builtins.diagnostics.php,
				null_ls.builtins.diagnostics.pylint,
				null_ls.builtins.diagnostics.rubocop,
				null_ls.builtins.diagnostics.shellcheck,
				null_ls.builtins.diagnostics.stylelint,
				null_ls.builtins.diagnostics.tidy,
				null_ls.builtins.diagnostics.yamllint,
				null_ls.builtins.formatting.autopep8,
				null_ls.builtins.formatting.beautysh,
				null_ls.builtins.formatting.black,
				null_ls.builtins.formatting.erb_lint,
				null_ls.builtins.formatting.eslint,
				null_ls.builtins.formatting.fish_indent,
				null_ls.builtins.formatting.fixjson,
				null_ls.builtins.formatting.gofmt,
				null_ls.builtins.formatting.gofumpt,
				null_ls.builtins.formatting.goimports,
				null_ls.builtins.formatting.isort,
				null_ls.builtins.formatting.json_tool,
				null_ls.builtins.formatting.nginx_beautifier,
				null_ls.builtins.formatting.pg_format,
				null_ls.builtins.formatting.prettier.with({
					filetypes = {
						"javascript",
						"javascriptreact",
						"typescript",
						"typescriptreact",
						"vue",
						"css",
						"scss",
						"less",
						"html",
						"json",
						"jsonc",
						"yaml",
						"graphql",
						"handlebars",
						"markdown",
					},
				}),
				null_ls.builtins.formatting.prismaFmt,
				null_ls.builtins.formatting.rubocop,
				null_ls.builtins.formatting.rustywind.with({
					filetypes = {
						"eruby",
						"javascript",
						"javascriptreact",
						"typescript",
						"typescriptreact",
						"vue",
						"svelte",
						"html",
					},
				}),
				null_ls.builtins.formatting.shfmt,
				null_ls.builtins.formatting.terraform_fmt,
				null_ls.builtins.formatting.yamlfmt,
				null_ls.builtins.formatting.tidy,
				null_ls.builtins.formatting.xmllint,
			},
		})
	end,
}
