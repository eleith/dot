set -x HOSTNAME (hostname)
set fish_greeting ""

set -x EDITOR nvim
set -x VISUAL nvim

# add local binaries to path
if test -d ~/.local/bin
    set PATH "$HOME/.local/bin" $PATH
end

# add go binaries to path
if test -d ~/.go
    set -gx GOPATH "$HOME/.go"
    set PATH "$HOME/.go/bin" $PATH
end

# add rust binaries to path
if test -d ~/.cargo/bin
    set PATH "$HOME/.cargo/bin" $PATH
end

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
