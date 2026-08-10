# The upstream executor image plus libatomic1 — the one shared library the
# pinned node runtime (buildjobs.mjs, /opt/stack-bin/node) needs that the
# image does not carry.
FROM quay.io/zuul-ci/zuul-executor:14.2.0
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends libatomic1 \
    && rm -rf /var/lib/apt/lists/*
