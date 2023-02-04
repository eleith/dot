return {
	"neovim/nvim-lspconfig",
	dependencies = {
		"hrsh7th/nvim-cmp",
	},
	config = function()
		local lspconfig = require("lspconfig")
		local capabilities = vim.lsp.protocol.make_client_capabilities()
		capabilities = require("cmp_nvim_lsp").default_capabilities(capabilities)
		capabilities.textDocument.completion.completionItem.snippetSupport = true

		local border = {
			{ "╭", "FloatBorder" },
			{ "─", "FloatBorder" },
			{ "╮", "FloatBorder" },
			{ "│", "FloatBorder" },
			{ "╯", "FloatBorder" },
			{ "─", "FloatBorder" },
			{ "╰", "FloatBorder" },
			{ "│", "FloatBorder" },
		}

		vim.diagnostic.config({ virtual_text = false, float = { border = border } })

		-- LSP settings (for overriding per client)
		local handlers = {
			["textDocument/hover"] = vim.lsp.with(vim.lsp.handlers.hover, { border = border }),
			["textDocument/signatureHelp"] = vim.lsp.with(vim.lsp.handlers.signature_help, { border = border }),
		}

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

		lspconfig.tsserver.setup({
			on_attach = on_attach,
			handlers = handlers,
			commands = {
				LspOrganizeImports = {
					organize_imports,
					description = "Organize Imports",
				},
			},
		})

		-- lspconfig.eslint.setup{on_attach = on_attach, capabilities = capabilities, handlers = handlers}
		lspconfig.tailwindcss.setup({ on_attach = on_attach, capabilities = capabilities, handlers = handlers })
		lspconfig.flow.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.graphql.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.html.setup({ on_attach = on_attach, capabilities = capabilities, handlers = handlers })
		-- lspconfig.markdown.setup{on_attach = on_attach, capabilities = capabilities, handlers = handlers}
		lspconfig.intelephense.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.jsonls.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.pyright.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.vimls.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.prismals.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.solargraph.setup({ on_attach = on_attach, capabilities = capabilities, handlers = handlers })
		-- lspconfig.stylelint_lsp.setup{on_attach = on_attach, handlers = handlers}
		lspconfig.bashls.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.dockerls.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.gopls.setup({
			on_attach = on_attach,
			handlers = handlers,
			root_dir = function()
				return vim.loop.cwd()
			end,
		})
		lspconfig.yamlls.setup({ on_attach = on_attach, handlers = handlers })
		lspconfig.cssls.setup({ on_attach = on_attach, capabilities = capabilities, handlers = handlers })
	end,
}
