return {
	"https://git.eleith.com/eleith/scratch-comments.nvim",
	keys = {
		{ "<leader>cc", "<Cmd>Comment<CR>",       desc = "Comment on line" },
		{ "<leader>cc", ":Comment<CR>",           mode = "x",                     desc = "Comment on selection" },
		{ "<leader>co", "<Cmd>CommentShow<CR>",   desc = "Open comment at cursor" },
		{ "<leader>cn", "<Cmd>CommentNext<CR>",   desc = "Next comment" },
		{ "<leader>cp", "<Cmd>CommentPrev<CR>",   desc = "Previous comment" },
		{ "<leader>cd", "<Cmd>CommentDelete<CR>", desc = "Delete comment" },
		{ "<leader>cx", "<Cmd>CommentExport<CR>", desc = "Copy comments" },
	},
}
