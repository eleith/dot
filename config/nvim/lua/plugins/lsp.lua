return {
	"neovim/nvim-lspconfig",
	dependencies = {
		"hrsh7th/nvim-cmp",
		"creativenull/efmls-configs-nvim",
	},
	config = function()
		local capabilities = vim.lsp.protocol.make_client_capabilities()

		capabilities = require("cmp_nvim_lsp").default_capabilities(capabilities)
		capabilities.textDocument.completion.completionItem.snippetSupport = true

		-- disable showing diagnostics in virtual text
		vim.diagnostic.config({
			virtual_text = false,
			float = { border = "rounded", focusable = true, header = false }
		})

		-- close quickfix menu after selecting choice
		vim.api.nvim_create_autocmd("FileType", {
			pattern = { "qf" },
			command = [[nnoremap <buffer> <CR> <CR>:cclose<CR>]],
		})

		-- LSP settings (for overriding per client)
		local handlers = {}

		local on_attach = function(_, bufnr)
			vim.keymap.set("n", "<leader>bf", function()
				vim.lsp.buf.format({ timeout = 2000, async = true })
			end, {
				noremap = true,
				silent = true,
				buffer = bufnr,
				desc = "format buffer with LSP",
			})

			vim.keymap.set("n", "<leader>xk", function()
				vim.lsp.buf.hover({ border = "rounded" })
			end, {
				noremap = true,
				silent = true,
				buffer = bufnr,
				desc = "show LSP hover",
			})

			vim.keymap.set("n", "<leader>xd", function()
				vim.diagnostic.open_float(nil)
			end, {
				noremap = true,
				silent = true,
				buffer = bufnr,
				desc = "show LSP diagnostics",
			})
		end

		local servers = {
			{ "ts_ls" },
			{ "tailwindcss" },
			{ "intelephense" },
			{ "docker_language_server" },
			{ "jsonls" },
			{ "lemminx" },
			{ "pyright" },
			{ "vimls" },
			{ "bashls" },
			{ "marksman" },
			{ "fish_lsp" },
			{
				"ruby_lsp",
				settings = {
					mason = false,
					cmd = { vim.fn.expand("~/.asdf/shims/ruby-lsp") },
					formatter = 'standard',
					linters = { 'standard' },
				},
			},
			{ "gopls" },
			{ "templ" },
			{ "golangci_lint_ls" },
			{ "eslint" },
			{
				"yamlls",
				filetypes = { "yaml", "markdown" },
				root_markers = { ".git", ".luzzle" },
				settings = {
					yaml = {
						validate = true,
						schemas = {
							["https://json.schemastore.org/github-workflow.json"] = "/.github/workflows/*",
							["https://raw.githubusercontent.com/woodpecker-ci/woodpecker/master/pipeline/schema/schema.json"] =
							"/.woodpecker",
						},
					},
				},
			},
			{
				"rust-analyzer",
				filetypes = {
					"rust",
				},
				cmd = {
					vim.fn.expand("~/.cargo/bin/rust-analyzer"),
				},
				imports = {
					granularity = {
						group = "module",
					},
					prefix = "self",
				},
				cargo = {
					buildScripts = {
						enable = true
					},
				},
				procMacro = {
					enable = true
				},
			},
			{ "stylelint_lsp" },
			{ "svelte" },
			{
				"superhtml",
				filetypes = {
					"html",
				},
				cmd = function(dispatchers)
					local buf_name = vim.api.nvim_buf_get_name(0)
					if string.match(buf_name, "%.html$") then
						return vim.lsp.rpc.start({ 'superhtml', 'lsp' }, dispatchers)
					else
						return vim.lsp.rpc.start({ 'superhtml', 'lsp', '--syntax-only' }, dispatchers)
					end
				end,
			},
			{ "cssls" },
			{
				"efm",
				filetypes = {
					"lua",
					"fish",
					"javascript",
					"typescript",
					"javascriptreact",
					"typescriptreact",
					"javascript.tsx",
					"typescript.tsx",
					"markdown",
					"eruby",
					"rust",
					"yaml",
					"svelte",
				},
				init_options = {
					documentFormatting = true,
					hover = true,
					documentSymbol = true,
					codeAction = true,
					completion = true,
				},
				settings = {
					rootMarkers = { ".git/" },
					languages = {
						eruby = {
							{
								prefix = "erblint",
								lintCommand = "erblint --format compact --stdin ${INPUT}",
								lintStdin = true,
								lintFormats = {
									"%f:%l:%c: %m",
								},
								lintIgnoreExitCode = true,
								formatCommand = "htmlbeautifier",
								formatStdin = true,
							}
						},
						lua = {
							require("efmls-configs.linters.luacheck"),
						},
						fish = {
							require("efmls-configs.linters.fish"),
							require("efmls-configs.formatters.fish_indent"),
						},
						yaml = {
							require("efmls-configs.formatters.prettier"),
						},
						gotmpl = {
							require("efmls-configs.formatters.prettier"),
						},
						javascript = {
							require("efmls-configs.formatters.prettier"),
						},
						typescript = {
							require("efmls-configs.formatters.prettier"),
						},
						javascriptreact = {
							require("efmls-configs.formatters.prettier"),
						},
						typescriptreact = {
							require("efmls-configs.formatters.prettier"),
						},
						["javascript.tsx"] = {
							require("efmls-configs.formatters.prettier"),
						},
						["typescript.tsx"] = {
							require("efmls-configs.formatters.prettier"),
						},
						markdown = {
							require("efmls-configs.linters.markdownlint"),
							require("efmls-configs.formatters.prettier"),
						},
						rust = {
							require('efmls-configs.formatters.rustfmt')
						},
						svelte = {
							require("efmls-configs.formatters.prettier"),
						},
					},
				},
			},
			{
				"lua_ls",
				settings = {
					Lua = {
						runtime = {
							version = 'LuaJIT',
						},
						diagnostics = {
							globals = { 'vim' },
						},
						workspace = {
							library = vim.api.nvim_get_runtime_file("", true),
						},
						telemetry = {
							enable = false,
						},
					},
				},
			},
		}

		for _, server in pairs(servers) do
			local setup_config = {
				on_attach = on_attach,
				handlers = handlers,
				capabilities = capabilities,
			}

			-- Add custom config if available
			for k, v in pairs(server) do
				if type(k) ~= "number" then
					setup_config[k] = v
				end
			end

			vim.lsp.config(server[1], setup_config)
			vim.lsp.enable(server[1])
		end
	end,
}
