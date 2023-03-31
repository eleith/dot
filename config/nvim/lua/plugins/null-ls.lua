return {
	"jose-elias-alvarez/null-ls.nvim",
	dependencies = {
		"nvim-lua/plenary.nvim",
		"lewis6991/gitsigns.nvim",
	},
	config = function()
		local null_ls = require("null-ls")
		local utils = require("null-ls.utils")
		local cmd_resolver = require("null-ls.helpers.command_resolver")

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
				-- nvim plugins
				null_ls.builtins.completion.spell,
				null_ls.builtins.code_actions.gitsigns,

				null_ls.builtins.diagnostics.stylelint.with({
					condition = function(u)
						local cmd = cmd_resolver.from_node_modules()({
							command = "stylelint",
							bufnr = vim.api.nvim_get_current_buf(),
							bufname = vim.api.nvim_buf_get_name(vim.api.nvim_get_current_buf()),
						})
						return utils.is_executable(cmd) and u.root_has_file(".stylelintrc.json")
					end,
					filetypes = {
						"css",
						"scss",
						"less",
						"vue",
						"html",
						"javascript",
						"javascriptreact",
						"typescript",
						"typescriptreact",
					},
				}),

				null_ls.builtins.formatting.stylelint.with({
					condition = function(u)
						local cmd = cmd_resolver.from_node_modules()({
							command = "stylelint",
							bufnr = vim.api.nvim_get_current_buf(),
							bufname = vim.api.nvim_buf_get_name(vim.api.nvim_get_current_buf()),
						})
						return utils.is_executable(cmd) and u.root_has_file(".stylelintrc.json")
					end,
					filetypes = {
						"css",
						"scss",
						"less",
						"vue",
						"html",
						"javascript",
						"javascriptreact",
						"typescript",
						"typescriptreact",
					},
				}),

				-- project local commands
				null_ls.builtins.formatting.eslint.with({
					condition = function()
						local cmd = cmd_resolver.from_node_modules()({
							command = "eslint",
							bufnr = vim.api.nvim_get_current_buf(),
							bufname = vim.api.nvim_buf_get_name(vim.api.nvim_get_current_buf()),
						})
						return utils.is_executable(cmd)
					end,
				}),
				null_ls.builtins.diagnostics.eslint.with({
					condition = function()
						local cmd = cmd_resolver.from_node_modules()({
							command = "eslint",
							bufnr = vim.api.nvim_get_current_buf(),
							bufname = vim.api.nvim_buf_get_name(vim.api.nvim_get_current_buf()),
						})
						return utils.is_executable(cmd)
					end,
				}),

				null_ls.builtins.formatting.prettier.with({
					condition = function()
						local cmd = cmd_resolver.from_node_modules()({
							command = "prettier",
							bufnr = vim.api.nvim_get_current_buf(),
							bufname = vim.api.nvim_buf_get_name(vim.api.nvim_get_current_buf()),
						})
						return utils.is_executable(cmd)
					end,
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
						"yaml",
						"jsonc",
						"graphql",
					},
				}),

				-- global commands
				null_ls.builtins.diagnostics.erb_lint.with({
					condition = function()
						return utils.is_executable("erblint")
					end,
				}),
				null_ls.builtins.formatting.erb_lint.with({
					condition = function()
						return utils.is_executable("erblint")
					end,
				}),

				null_ls.builtins.code_actions.shellcheck.with({
					condition = function()
						return utils.is_executable("shellcheck")
					end,
				}),
				null_ls.builtins.diagnostics.shellcheck.with({
					condition = function()
						return utils.is_executable("shellcheck")
					end,
				}),

				null_ls.builtins.diagnostics.buf.with({
					condition = function()
						return utils.is_executable("buf")
					end,
				}),

				null_ls.builtins.diagnostics.checkmake.with({
					condition = function()
						return utils.is_executable("checkmake")
					end,
				}),

				null_ls.builtins.diagnostics.codespell.with({
					condition = function()
						return utils.is_executable("codespell")
					end,
				}),

				null_ls.builtins.diagnostics.fish.with({
					condition = function()
						return utils.is_executable("fish")
					end,
				}),
				null_ls.builtins.formatting.fish_indent.with({
					condition = function()
						return utils.is_executable("fish_indent")
					end,
				}),

				null_ls.builtins.diagnostics.flake8.with({
					condition = function()
						return utils.is_executable("flake8")
					end,
				}),

				null_ls.builtins.diagnostics.golangci_lint.with({
					condition = function()
						return utils.is_executable("golangci-lint")
					end,
				}),

				null_ls.builtins.diagnostics.jsonlint.with({
					condition = function()
						return utils.is_executable("jsonlint")
					end,
				}),

				null_ls.builtins.diagnostics.luacheck.with({
					condition = function()
						return utils.is_executable("luacheck")
					end,
				}),
				null_ls.builtins.formatting.stylua.with({
					condition = function()
						return utils.is_executable("stylua")
					end,
				}),

				null_ls.builtins.diagnostics.markdownlint.with({
					condition = function()
						return utils.is_executable("markdownlint")
					end,
				}),
				null_ls.builtins.formatting.markdownlint.with({
					condition = function()
						return utils.is_executable("markdownlint")
					end,
				}),

				null_ls.builtins.diagnostics.mypy.with({
					condition = function()
						return utils.is_executable("mypy")
					end,
				}),

				null_ls.builtins.diagnostics.php.with({
					condition = function()
						return utils.is_executable("php")
					end,
				}),

				null_ls.builtins.diagnostics.pylint.with({
					condition = function()
						return utils.is_executable("pylint")
					end,
				}),

				null_ls.builtins.diagnostics.rubocop.with({
					condition = function()
						return utils.is_executable("rubocop")
					end,
				}),
				null_ls.builtins.formatting.rubocop.with({
					condition = function()
						return utils.is_executable("rubocop")
					end,
				}),

				null_ls.builtins.diagnostics.tidy.with({
					condition = function()
						return utils.is_executable("tidy")
					end,
				}),
				null_ls.builtins.formatting.tidy.with({
					condition = function()
						return utils.is_executable("tidy")
					end,
				}),

				null_ls.builtins.formatting.autopep8.with({
					condition = function()
						return utils.is_executable("autopep8")
					end,
				}),

				null_ls.builtins.formatting.beautysh.with({
					condition = function()
						return utils.is_executable("beautysh")
					end,
				}),

				null_ls.builtins.formatting.black.with({
					condition = function()
						return utils.is_executable("black")
					end,
				}),

				null_ls.builtins.formatting.fixjson.with({
					condition = function()
						return utils.is_executable("fixjson")
					end,
				}),

				null_ls.builtins.formatting.gofmt.with({
					condition = function()
						return utils.is_executable("gofmt")
					end,
				}),

				null_ls.builtins.formatting.gofumpt.with({
					condition = function()
						return utils.is_executable("gofumpt")
					end,
				}),

				null_ls.builtins.formatting.goimports.with({
					condition = function()
						return utils.is_executable("goimports")
					end,
				}),

				null_ls.builtins.formatting.isort.with({
					condition = function()
						return utils.is_executable("isort")
					end,
				}),

				null_ls.builtins.formatting.nginx_beautifier.with({
					condition = function()
						return utils.is_executable("nginxbeautifier")
					end,
				}),

				null_ls.builtins.formatting.pg_format.with({
					condition = function()
						return utils.is_executable("pg_format")
					end,
				}),

				null_ls.builtins.formatting.prismaFmt.with({
					condition = function()
						return utils.is_executable("prisma-fmt")
					end,
				}),

				null_ls.builtins.formatting.rustywind.with({
					condition = function()
						return utils.is_executable("rustywind")
					end,
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

				null_ls.builtins.formatting.shfmt.with({
					condition = function()
						return utils.is_executable("shfmt")
					end,
				}),

				null_ls.builtins.diagnostics.terraform_validate.with({
					condition = function()
						return utils.is_executable("terraform")
					end,
				}),
				null_ls.builtins.formatting.terraform_fmt.with({
					condition = function()
						return utils.is_executable("terraform")
					end,
				}),

				null_ls.builtins.diagnostics.actionlint.with({
					condition = function()
						return utils.is_executable("actionlint")
					end,
				}),

				null_ls.builtins.formatting.xmllint.with({
					condition = function()
						return utils.is_executable("xmllint")
					end,
				}),

				null_ls.builtins.formatting.deno_fmt.with({
					condition = function()
						return utils.is_executable("deno")
					end,
					filetypes = { "markdown" },
				}),
			},
		})
	end,
}
