function fish_title --argument-names last_cmd
    set prefix ""
    set last_path (string split ' ' $last_cmd)[2..]

    if set -q SSH_CLIENT
        if not set -q TMUX
            set prefix "@$hostname "
        end
    end

    set shortpwd (fish_prompt_pwd_dir_length=1 prompt_pwd)

    if [ fish != $_ ]
        switch $_
            case vi vim nvim
                echo "$prefix$_ $(path basename $last_path)"
            case '*'
                echo "$prefix$last_cmd"
        end
    else
        echo "$prefix$shortpwd"
    end
end
