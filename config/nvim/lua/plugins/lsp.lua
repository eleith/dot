return {
	"neovim/nvim-lspconfig",
	dependencies = {
		"hrsh7th/nvim-cmp",
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

		-- override all window borders
		local orig_util_open_floating_preview = vim.lsp.util.open_floating_preview
		local border = "rounded"

		function vim.lsp.util.open_floating_preview(contents, syntax, opts, ...)
			opts = opts or {}
			opts.border = border
			return orig_util_open_floating_preview(contents, syntax, opts, ...)
		end

		-- lspinfo needs a separate override
		lspwindow.default_options = {
			border = border,
		}

		-- LSP settings (for overriding per client)
		local handlers = {}
		local opts = { noremap = true, silent = true }

		vim.keymap.set("n", "<space>e", "<cmd>lua vim.diagnostic.open_float()<CR>", opts)
		vim.keymap.set("n", "<space>en", "<cmd>lua vim.diagnostic.goto_next()<CR>", opts)
		vim.keymap.set("n", "<space>ep", "<cmd>lua vim.diagnostic.goto_prev()<CR>", opts)
		vim.keymap.set("n", "<space>q", "<cmd>lua vim.diagnostic.setloclist()<CR>", opts)

		local on_attach = function(_, bufnr)
			-- Mappings.
			local bufopts = { noremap = true, silent = true, buffer = bufnr }

			-- See `:help vim.lsp.*` for documentation on any of the below functions
			vim.keymap.set("n", "gD", vim.lsp.buf.declaration, bufopts)
			vim.keymap.set("n", "gd", vim.lsp.buf.definition, bufopts)
			vim.keymap.set("n", "K", vim.lsp.buf.hover, bufopts)
			vim.keymap.set("n", "gi", vim.lsp.buf.implementation, bufopts)
			vim.keymap.set("n", "<C-k>", vim.lsp.buf.signature_help, bufopts)
			vim.keymap.set("n", "<space>D", vim.lsp.buf.type_definition, bufopts)
			vim.keymap.set("n", "<space>rn", vim.lsp.buf.rename, bufopts)
			vim.keymap.set("n", "<space>ca", vim.lsp.buf.code_action, bufopts)
			vim.keymap.set("n", "gr", vim.lsp.buf.references, bufopts)
			vim.keymap.set("n", "<space>f", vim.lsp.buf.formatting, bufopts)
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
				"tsserver",
				commands = {
					LspOrganizeImports = {
						organize_imports,
						description = "Organize Imports",
					},
				},
			},
			{ "tailwindcss" },
			{ "flow" },
			{ "graphql" },
			{ "html" },
			{ "intelephense" },
			{ "jsonls" },
			{ "pyright" },
			{ "vimls" },
			{ "prismals" },
			{ "solargraph" },
			{ "bashls" },
			{ "dockerls" },
			{ "gopls", {
				root_dir = function()
					return vim.loop.cwd()
				end,
			} },
			{
				"yamlls",
				{
					settings = {
						yaml = {
							schemas = {
								["https://json.schemastore.org/github-workflow.json"] = "/.github/workflows/*",
								["https://raw.githubusercontent.com/woodpecker-ci/woodpecker/master/pipeline/schema/schema.json"] = "/.woodpecker",
							},
						},
					},
				},
			},
			{ "cssls" },
			{ "lua_ls" },
		}

		for _, server in pairs(servers) do
			local config = lspconfig[server[1]]
			-- Only setup a language server if we have the binary available!
			if vim.fn.executable(config.document_config.default_config.cmd[1]) == 1 then
				local opts = {
					on_attach = on_attach,
					handlers = handlers,
					capabilities = capabilities,
				}

				-- Add custom config if available
				for k, v in pairs(server) do
					if type(k) ~= "number" then
						opts[k] = v
					end
				end

				config.setup(opts)
			end
		end
	end,
}
