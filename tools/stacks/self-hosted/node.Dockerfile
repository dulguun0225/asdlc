# The static test node Zuul jobs run on. Mirrors the upstream quickstart's
# node (git, openssh, rsync, python3 for Ansible), except keys: the upstream
# tutorial commits an SSH host key; here host keys are generated at first
# start and the nodepool public key is copied in from the bind mount, so no
# key material lives in the image or the repository.
FROM docker.io/ubuntu:24.04

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get -y install \
        git \
        openssh-server \
        python3 \
        rsync \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir /var/run/sshd

COPY <<'EOF' /entrypoint.sh
#!/bin/sh
set -e
ssh-keygen -A
mkdir -p -m 0700 /root/.ssh
cp /var/bootstrap/nodepool.pub /root/.ssh/authorized_keys
chown root:root /root/.ssh/authorized_keys
chmod 0600 /root/.ssh/authorized_keys
exec /usr/sbin/sshd -D
EOF
RUN chmod +x /entrypoint.sh

EXPOSE 22
ENTRYPOINT ["/entrypoint.sh"]
