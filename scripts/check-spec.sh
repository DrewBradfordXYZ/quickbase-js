#!/bin/sh
# Stops generation from a spec checkout older than the one this repo records.
# `git pull` doesn't move the spec submodule, so a checkout can fall behind
# without notice, and generating from it writes a client for an old API.
# A checkout ahead of the recorded commit (working on a newer spec) is fine.
set -e
cd "$(git rev-parse --show-toplevel)"
recorded=$(git ls-tree HEAD spec | awk '{print $3}')
actual=$(git -C spec rev-parse HEAD 2>/dev/null || echo none)
[ "$recorded" = "$actual" ] && exit 0
if [ "$actual" = none ] || ! git -C spec cat-file -e "$recorded^{commit}" 2>/dev/null \
  || git -C spec merge-base --is-ancestor "$actual" "$recorded"; then
  echo "The spec submodule is at ${actual}, behind the commit this repo records (${recorded})." >&2
  echo "Run: git submodule update --init spec" >&2
  exit 1
fi
echo "Note: generating from spec ${actual}, ahead of the recorded ${recorded}."
