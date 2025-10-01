set -x HOSTNAME (hostname)
set fish_greeting ""

set -x EDITOR nvim
set -x VISUAL nvim
set -gx GOPATH "$HOME/.go"

# add local binaries to path
if test -d ~/.local/bin
    set PATH "$HOME/.local/bin" $PATH
end

# add go binaries to path
if test -d ~/.go
    set PATH "$HOME/.go/bin" $PATH
end

# add rust binaries to path
if test -d ~/.cargo/bin
    set PATH "$HOME/.cargo/bin" $PATH
end

# load up asdf completions
if test -f ~/.asdf/asdf.fish
    source ~/.asdf/asdf.fish
end

# load up gcloud completions
if test -f ~/dev/google-cloud-sdk/path.fish.inc
    set PATH "$HOME/dev/google-cloud-sdk/bin" $PATH
    source ~/dev/google-cloud-sdk/path.fish.inc
end

# support gcr with ssh agent
if set -q SSH_AUTH_SOCK
    set SSH_AUTH_SOCK_PREVIOUS $SSH_AUTH_SOCK
    set GCR_SSH_SOCK /run/user/(id -u)/gcr/ssh
    if test -S $GCR_SSH_SOCK
        set -x SSH_AUTH_SOCK $GCR_SSH_SOCK
    end
end

if type -q fzf
    set -gx FZF_DEFAULT_OPTS "
--preview-window=:hidden
--preview='__fzf_preview {}'
--layout=reverse
--height=80%
--border
--margin=1
--padding=1
--info=inline
--bind='ctrl-p:toggle-preview'
"
    if type -q fzf_configure_bindings
        set fzf_directory_opts --bind "ctrl-o:execute($EDITOR {} &> /dev/tty)"
        fzf_configure_bindings --directory=\cf --git_status=\cg
    end
end

# set theme
fish_config theme choose gruvbox-dark

# set keybindings
bind \cB beginning-of-line
