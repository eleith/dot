set -x HOSTNAME (hostname)
set fish_greeting ""

set -x EDITOR nvim
set -x VISUAL nvim
set -gx GOPATH "$HOME/.go"

# add local binaries to path
if test -d ~/.local/bin
    set PATH "$HOME/.local/bin" $PATH
end

if type -q mise
	mise activate fish | source
end

# support gcr with ssh agent
if set -q SSH_AUTH_SOCK
    set SSH_AUTH_SOCK_PREVIOUS $SSH_AUTH_SOCK
    set GCR_SSH_SOCK /run/user/(id -u)/gcr/ssh
    if test -S $GCR_SSH_SOCK
        set -x SSH_AUTH_SOCK $GCR_SSH_SOCK
    end
end

fish_config theme choose modus-tinted

# set keybindings
bind \cB beginning-of-line
