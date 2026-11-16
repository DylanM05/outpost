# Outpost follows the shell's working directory through this escape sequence,
# which terminals otherwise ignore, and saves the history after every command
# so a mission can see what was run.
__outpost_prompt() {
	history -a
	printf '\033]7;file://%s%s\007' "$HOSTNAME" "$PWD"
}
PROMPT_COMMAND=__outpost_prompt
