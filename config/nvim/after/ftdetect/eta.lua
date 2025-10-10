-- For *.html.eta files
vim.api.nvim_create_autocmd({ 'BufNewFile', 'BufRead' }, {
  pattern = '*.html.eta',
  callback = function()
    vim.bo.filetype = 'html'
  end,
})

-- For *.css.eta files
vim.api.nvim_create_autocmd({ 'BufNewFile', 'BufRead' }, {
  pattern = '*.css.eta',
  callback = function()
    vim.bo.filetype = 'css'
  end,
})
