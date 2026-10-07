return {
	"https://git.eleith.com/eleith/scratch-comments.nvim",
	lazy = false,
	keys = {
		{ "<leader>cc", "<Cmd>Comment<CR>",       desc = "Comment on line" },
		{ "<leader>cc", ":Comment<CR>",           mode = "x",                desc = "Comment on selection" },
		{ "<leader>cl", "<Cmd>CommentList<CR>",   desc = "List all comments" },
		{ "<leader>cr", "<Cmd>CommentClear<CR>",  desc = "Clear all comments" },
		{ "<leader>cd", "<Cmd>CommentDelete<CR>", desc = "Delete comment" },
		{ "<leader>cx", "<Cmd>CommentExport<CR>", desc = "Copy comments" },
	},
}
