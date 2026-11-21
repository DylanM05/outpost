# check=skip=FromPlatformFlagConstDisallowed
# (The relay stage is 32-bit on purpose, whatever the build machine is.)

# Builds the game and serves it as static files. Learner code runs in each
# player's browser, so the server never executes it: Python runs in a worker,
# and the relay terminal is a small Linux machine emulated by v86.

# The relay terminal's Linux system. It's 32-bit Alpine because v86 emulates a
# 32-bit PC. `npm run vm` builds just these stages for local development.
FROM --platform=linux/386 docker.io/i386/alpine:3.24.4 AS relay-rootfs
# pyc installs the precompiled bytecode Alpine packages separately: the player
# can't write Python's cache under /usr/lib, so without it pytest would be
# compiled again on every run.
RUN apk add --no-cache \
      openrc alpine-base linux-virt linux-firmware-none \
      bash coreutils findutils grep sed diffutils file tree less nano mandoc \
      git python3 py3-pytest pyc sudo procps-ng \
      bash-doc coreutils-doc findutils-doc grep-doc sed-doc diffutils-doc file-doc tree-doc less-doc nano-doc mandoc-doc git-doc procps-ng-doc sudo-doc
# The player is "ranger". The game's check agent runs as root on the second
# serial port, out of the player's sight, and starts the player's login shell
# on the first.
RUN adduser -D -s /bin/bash -h /home/ranger ranger \
 && addgroup ranger wheel \
 && echo "ranger:outpost" | chpasswd \
 && passwd -l root \
 && echo '%wheel ALL=(ALL:ALL) ALL' > /etc/sudoers.d/wheel \
 && echo relay > /etc/hostname \
 && : > /etc/motd \
 && sed -i '/^tty[0-9]/d' /etc/inittab \
 && echo 'ttyS1::respawn:/usr/bin/python3 /usr/local/lib/outpost/agent.py' >> /etc/inittab
COPY vm/guest/ /
RUN chown -R ranger:ranger /home/ranger \
 && for s in devfs dmesg mdev hwdrivers; do rc-update add $s sysinit; done \
 && for s in modules sysctl hostname bootmisc; do rc-update add $s boot; done \
 && rc-update add killprocs shutdown \
 && mkinitfs -F "base virtio 9p" "$(cat /usr/share/kernel/virt/kernel.release)"
COPY vm/mktar.py /mktar.py
RUN python3 /mktar.py && rm /mktar.py

# Turns the filesystem into v86's format: an index of every file, plus each
# file's contents compressed and named by hash, fetched only when it's read.
FROM docker.io/alpine:3.24.4 AS relay-pack
RUN apk add --no-cache python3 py3-zstandard
COPY vm/tools/ /tools/
COPY --from=relay-rootfs /rootfs.tar /rootfs.tar
RUN mkdir -p /out/rootfs \
 && python3 /tools/fs2json.py --zstd --out /out/fs.json /rootfs.tar \
 && python3 /tools/copy-to-sha256.py --zstd /rootfs.tar /out/rootfs > /dev/null

FROM scratch AS relay-files
COPY --from=relay-pack /out/ /

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
RUN npm ci
COPY . .
# Boot the relay machine once and save it, so players start at a ready shell.
COPY --from=relay-files / public/vm/
RUN node vm/build-state.mjs
RUN npm run build

FROM nginx:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
