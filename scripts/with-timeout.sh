#!/bin/bash
# Wrapper script to add timeout to commands
# Usage: ./scripts/with-timeout.sh <seconds> <command>

TIMEOUT_SECONDS=$1
shift
COMMAND="$@"

# Start command in background
$COMMAND &
CMD_PID=$!

# Wait for timeout or command completion
sleep $TIMEOUT_SECONDS &
SLEEP_PID=$!

wait $CMD_PID 2>/dev/null
CMD_EXIT=$?

# Kill sleep if command finished early
kill $SLEEP_PID 2>/dev/null

if [ $CMD_EXIT -eq 0 ]; then
  exit 0
else
  # Command may have timed out or failed
  if kill -0 $CMD_PID 2>/dev/null; then
    echo "Command timed out after ${TIMEOUT_SECONDS} seconds"
    kill -9 $CMD_PID 2>/dev/null
    exit 124
  else
    exit $CMD_EXIT
  fi
fi

