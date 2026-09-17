-- return {
-- 	"ellisonleao/gruvbox.nvim",
-- 	lazy = false,
-- 	priority = 1000,
-- 	config = function()
-- 		local gruvbox = require("gruvbox")
-- 
-- 		gruvbox.setup({
-- 			overrides = {
-- 				NormalFloat = { bg = "none" },
-- 			},
-- 		})
-- 
-- 		vim.cmd.colorscheme("gruvbox")
-- 	end,
-- }

return {
  "miikanissi/modus-themes.nvim",
  priority = 1000,
  config = function()
    require("modus-themes").setup({
      style = "auto", -- auto switches based on vim.o.background
      variants = {
				modus_operandi = 'tinted',
				modus_vivendi = 'tinted',
			},
      transparent = false,
      styles = {
        comments = { italic = true },
        keywords = { italic = false },
      },
    })
    vim.cmd("colorscheme modus")
  end,
}
