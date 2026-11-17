---
id: sign-your-work
kind: terminal
title: Sign your work
system: Archive terminal
symbol: controller
scene: console
skills: git-config
---

## Briefing

The archive won't accept anonymous changes: every saved version records who made it, so anyone can ask them about it later. Git needs to know who you are before you save anything. The valley also asks that every new history start on a branch called `main`.

## Objective

Set three Git settings for your user, so they apply in every repository you make:

| Setting | Value |
|---|---|
| `user.name` | `Ranger` |
| `user.email` | `ranger@kestrel.ridge` |
| `init.defaultBranch` | `main` |

## Concept

Git's settings have names in two parts: a section and a key, as in `user.name`. `git config set` sets one:

```bash
git config set --global user.name "Ranger"
```

`--global` makes it your setting for every repository you use, rather than one repository's. Git keeps your global settings in a file in your home folder, `~/.gitconfig`. `cat ~/.gitconfig` shows what's there.

Every saved version records the `user.name` and `user.email` that made it. On your own computer, use your own name and the email address you use for code hosting sites like GitHub. Here, use the ranger's.

`init.defaultBranch` is the name new repositories give their first **branch**, the line their history grows along. Branches come later in the archive. For now, `main` is the name most projects use.

Older guides write `git config --global user.name "Ranger"`, without `set`. Git still understands that, so you'll see both.

## Hints

1. Run `git config set --global` once for each setting: the setting's name, then its value.
2. Put the value in quotes if it has a space in it.
3. Run `cat ~/.gitconfig` to see all three settings.

## Checks

```python
expect("user.name is Ranger", lambda: config("user.name", scope="global"), "Ranger", "git config set --global user.name Ranger")
expect(
    "user.email is ranger@kestrel.ridge",
    lambda: config("user.email", scope="global"),
    "ranger@kestrel.ridge",
    "git config set --global user.email ranger@kestrel.ridge",
)
expect("init.defaultBranch is main", lambda: config("init.defaultBranch", scope="global"), "main", "git config set --global init.defaultBranch main")
```

## Solution

```bash
git config set --global user.name "Ranger"
git config set --global user.email ranger@kestrel.ridge
git config set --global init.defaultBranch main
cat ~/.gitconfig
```

## Restored

Git knows who you are. Everything you save from now on carries your name, `Ranger`, so the valley knows who to ask about it.
