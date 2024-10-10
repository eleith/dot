return {
	"neovim/nvim-lspconfig",
	dependencies = {
		"hrsh7th/nvim-cmp",
		"creativenull/efmls-configs-nvim",
	},
	config = function()
		local lspconfig = require("lspconfig")
		local capabilities = vim.lsp.protocol.make_client_capabilities()
		local lspwindow = require("lspconfig.ui.windows")

		capabilities = require("cmp_nvim_lsp").default_capabilities(capabilities)
		capabilities.textDocument.completion.completionItem.snippetSupport = true

		-- disable showing diagnostics in virtual text
		vim.diagnostic.config({ virtual_text = false })

		-- close quickfix menu after selecting choice
		vim.api.nvim_create_autocmd("FileType", {
			pattern = { "qf" },
			command = [[nnoremap <buffer> <CR> <CR>:cclose<CR>]],
		})

		-- lspinfo needs a separate override
		lspwindow.default_options = {
			border = "rounded",
		}

		-- LSP settings (for overriding per client)
		local handlers = {}

		local on_attach = function(_, bufnr)
			-- Mappings.
			local bufopts = { noremap = true, silent = true, buffer = bufnr }

			-- See `:help vim.lsp.*` for more methods
			vim.keymap.set("n", "<leader>bf", function()
				vim.lsp.buf.format({ timeout = 2000, async = true })
			end, bufopts)
		end

		local function organize_imports()
			local params = {
				command = "_typescript.organizeImports",
				arguments = { vim.api.nvim_buf_get_name(0) },
				title = "",
			}
			vim.lsp.buf.execute_command(params)
		end

		local servers = {
			{
				"ts_ls",
				commands = {
					LspOrganizeImports = {
						organize_imports,
						description = "Organize Imports",
					},
				},
			},
			{ "tailwindcss" },
			{ "graphql" },
			{ "intelephense" },
			{ "jsonls" },
			{ "pyright" },
			{ "vimls" },
			{ "bashls" },
			{ "dockerls" },
			{ "rubocop" },
			{ "marksman" },
			{ "ruby_lsp" },
			{ "gopls" },
			{ "eslint" },
			{
				"yamlls",
				settings = {
					yaml = {
						schemas = {
							["https://json.schemastore.org/github-workflow.json"] = "/.github/workflows/*",
							["https://raw.githubusercontent.com/woodpecker-ci/woodpecker/master/pipeline/schema/schema.json"] =
							"/.woodpecker",
						},
					},
				},
			},
			{ "stylelint_lsp" },
			{ "svelte" },
			{
				"html",
				settings = {
					html = {
						hover = {
							documentation = true,
							references = true,
						},
					},
					css = {
						validate = true,
					},
				},
			},
			{ "cssls" },
			{
				"efm",
				filetypes = {
					"lua",
					"fish",
					"html",
					"javascript",
					"typescript",
					"javascriptreact",
					"typescriptreact",
					"javascript.tsx",
					"typescript.tsx",
					"markdown",
					"eruby",
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
						html = {
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
			local config = lspconfig[server[1]]
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

			config.setup(setup_config)
		end
	end,
}
