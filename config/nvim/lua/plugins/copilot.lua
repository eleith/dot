return {
	"zbirenbaum/copilot.lua",
	cmd = "Copilot",
	event = "InsertEnter",
  dependencies = { "folke/snacks.nvim" },
	keys = {
    {
      "<leader>ai",
      function()
        local Snacks = require("snacks")
				local copilot = Snacks.toggle.get('copilot')
        if copilot then
					copilot:toggle()
        end
      end,
      desc = "Toggle Copilot",
    },
  },
	config = function()
		require("snacks").toggle({
			name = "copilot",
			get = function()
				if not vim.g.copilot_enabled then -- HACK: since it's disabled by default the below will throw error
					return false
				end
				return not require("copilot.client").is_disabled()
			end,
			set = function(state)
				if state then
					require("copilot").setup({
						suggestion = {
							auto_trigger = true,
							keymap = {
								accept = false,
								next = "<M-Right>",
								prev = "<M-Left>",
								dismiss = "<M-Down>",
							},
						}
					})
					require("copilot.command").enable()
					vim.g.copilot_enabled = true
					vim.keymap.set('i', '<Tab>', function()
						if require("copilot.suggestion").is_visible() then
							require("copilot.suggestion").accept()
						else
							vim.api.nvim_feedkeys(vim.api.nvim_replace_termcodes("<Tab>", true, false, true), "n", false)
						end
					end, { desc = "Super Tab" })
				else
					require("copilot.command").disable()
					vim.g.copilot_enabled = false
				end
			end,
		})
	end,
}
