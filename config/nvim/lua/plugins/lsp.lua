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

		local function typescript_project(bufnr)
			local root = vim.fs.root(bufnr, {
				"package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock",
			})
			if not root then return nil, nil end

			local file = root .. "/node_modules/typescript/package.json"
			if vim.fn.filereadable(file) ~= 1 then return root, nil end

			local ok, pkg = pcall(vim.json.decode, table.concat(vim.fn.readfile(file), "\n"))
			local major = ok and tonumber((pkg.version or ""):match("^(%d+)")) or nil
			return root, major
		end

		local servers = {
			{
				"tsc",
				root_dir = function(bufnr, on_dir)
					local root, major = typescript_project(bufnr)
					if root and major and major >= 7 then on_dir(root) end
				end,
			},
			{
				"ts_ls",
				root_dir = function(bufnr, on_dir)
					local root, major = typescript_project(bufnr)
					if root and (not major or major < 7) then on_dir(root) end
				end,
			},
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
			{ "tombi" },
			{ "gopls" },
			{ "templ" },
			{ "golangci_lint_ls" },
			{ "eslint" },
			{
				"luzzle_lsp",
				cmd = { 'luzzle-lsp', '--stdio' },
				filetypes = { 'markdown' },
				root_markers = { ".luzzle" },
				workspace_required = true,
			},
			{
				"yamlls",
				filetypes = { "yaml" },
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
				"rust_analyzer",
				settings = {
					["rust-analyzer"] = {
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
