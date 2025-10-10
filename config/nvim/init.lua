-- lazy setup
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"

if not vim.uv.fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({ "git", "clone", "--filter=blob:none", "--branch=stable", lazyrepo, lazypath })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- set fish as default shell
vim.cmd("set shell=/usr/bin/fish")

-- hide unsaved changes into buffer when opening a new buffer
vim.cmd("set hidden")

-- don't give |ins-completion-menu| messages.
vim.cmd("set shortmess+=c")

-- change split defaults to be more intuitive...
vim.cmd("set splitbelow")
vim.cmd("set splitright")

-- disable mouse
vim.cmd("set mouse=")

-- in insertmode, replace tabs with spaces
vim.cmd("set expandtab")

-- briefly show matching bracket when one is inserted
vim.cmd("set showmatch")

-- always show gutter
vim.cmd("set signcolumn=yes")

-- tabs are represented by 2 spaces in edit mode
vim.cmd("set tabstop=2")

-- tabs are represented by 2 spaces during auto-indent
vim.cmd("set shiftwidth=2")

-- set title as new buffers/files are opened
vim.cmd("set titlestring=vi\\ %t")
vim.cmd("set title")

-- set theme
vim.cmd("set termguicolors")
vim.cmd([["let &t_8f = "\<Esc>[38;2;%lu;%lu;%lum"]])
vim.cmd([["let &t_8b = "\<Esc>[48;2;%lu;%lu;%lum"]])

-- tmux customization
vim.cmd([[augroup tmux
  autocmd!
    if exists('$TMUX')
      autocmd BufReadPost,FileReadPost,BufNewFile,BufEnter * call
      \ system("tmux rename-window 'vim['" . expand("%:t") . "']")
    endif
augroup END]])

vim.opt.completeopt = "menuone,noselect"

-- https://github.com/neovim/neovim/issues/17070#issuecomment-1086775760
if vim.env.TERM == "tmux-256color" then
	vim.uv.fs_write(2, "\27Ptmux;\27\27]11;?\7\27\\", -1, nil)
end

-- set generic text dimensions
vim.opt_local.wrap = true
vim.opt_local.textwidth = 80

-- register uncommon file types
vim.filetype.add({ extension = { gohtml = "gotmpl" }})
vim.filetype.add({ extension = { gotext = "gotexttmpl" }})
vim.filetype.add({ extension = { mod = "gomod" }})
vim.filetype.add({ extension = { sum = "gosum" }})
vim.filetype.add({ extension = { gowork = "gowork" }})

-- load plugins folder with lazy.nvim
require("lazy").setup("plugins", {
	ui = {
		border = "rounded",
	},
})
