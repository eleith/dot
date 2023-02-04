set -x HOSTNAME (hostname)
set fish_greeting ""

set -x EDITOR nvim
set -x VISUAL nvim

# make binaries available in $PATH
set PATH "$HOME/.local/bin" $PATH
set PATH "$HOME/shelf/go/bin" $PATH
set PATH "$HOME/.cargo/bin" $PATH
set PATH "$HOME/.local/share/gem/ruby/3.1.0/bin" $PATH
set -gx GOPATH "$HOME/shelf/go"

# customize fzf to hide preview and make it toggle
set -gx FZF_DEFAULT_OPTS "
--preview-window=:hidden
--preview='__fzf_preview {}'
--bind '?:toggle-preview'
"

# load up asdf completions
if test -f ~/.asdf/asdf.fish
    source ~/.asdf/asdf.fish
end

# load up gcloud completions
if test -f ~/dev/google-cloud-sdk/path.fish.inc
    set PATH "$HOME/dev/google-cloud-sdk/bin" $PATH
    source ~/dev/google-cloud-sdk/path.fish.inc
end
