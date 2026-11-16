# Bash reads this file every time it starts in a terminal.

# The prompt: user@machine:directory$
PS1='\[\e[1;32m\]\u@\h\[\e[0m\]:\[\e[1;34m\]\w\[\e[0m\]\$ '

alias ls='ls --color=auto'
alias grep='grep --color=auto'

export EDITOR=nano
