#!/usr/bin/env bash
set -euo pipefail

BUCKET="cppserbia-images"
REMOTE="cppserbia-r2"
LOCAL_DIR="$(git rev-parse --show-toplevel)/images/events"
REMOTE_PATH="${REMOTE}:${BUCKET}/events/"

usage() {
  echo "Usage: $0 <upload|download>"
  echo ""
  echo "  upload    Sync local images/events/ → R2 bucket"
  echo "  download  Sync R2 bucket → local images/events/"
  echo ""
  echo "Requires rclone configured with an '${REMOTE}' remote."
  echo "See scripts/README.md for setup instructions."
  exit 1
}

if [ $# -ne 1 ]; then
  usage
fi

# Ensure local directory exists
mkdir -p "$LOCAL_DIR"

case "$1" in
  upload)
    echo "Uploading images to R2..."
    rclone sync "$LOCAL_DIR" "$REMOTE_PATH" --progress
    echo "Done."
    ;;
  download)
    echo "Downloading images from R2..."
    rclone sync "$REMOTE_PATH" "$LOCAL_DIR" --progress
    echo "Done."
    ;;
  *)
    usage
    ;;
esac
