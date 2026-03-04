#!/usr/bin/env bash
# Run the bot against the test Discord server and a separate MongoDB database.
#
# Usage:
#   bash scripts/dev-test.sh            # start bot in test mode (hot-reload)
#   bash scripts/dev-test.sh --deploy   # deploy slash commands to test guild, then start

set -e

ENV_FILE=".env"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found."
    echo "Copy .env.test.example to .env.test and fill in your test bot credentials."
    exit 1
fi

# Load env
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# ─── MongoDB ────────────────────────────────────────────────────────────────
MONGO_PORT="${MONGODB_PORT:-27017}"
MONGO_DATA="$ROOT/.mongo/data"
MONGO_LOG="$ROOT/.mongo/mongod.log"
MONGOD_PID=""

mkdir -p "$MONGO_DATA"

# Check if MongoDB is already accepting connections
mongo_ping() {
    mongosh --port "$MONGO_PORT" --eval "db.runCommand({ping:1})" --quiet 2>/dev/null \
    || mongo   --port "$MONGO_PORT" --eval "db.runCommand({ping:1})" --quiet 2>/dev/null
}

if mongo_ping; then
    echo "MongoDB already running on port $MONGO_PORT — skipping startup."
else
    echo "Starting MongoDB on port $MONGO_PORT (data: .mongo/data)..."
    mongod \
        --dbpath "$MONGO_DATA" \
        --logpath "$MONGO_LOG" \
        --port   "$MONGO_PORT" \
        &
    MONGOD_PID=$!

    # Wait up to 10s for MongoDB to become ready
    for i in $(seq 1 20); do
        if mongo_ping; then
            echo "MongoDB ready."
            break
        fi
        sleep 0.5
        if [ "$i" -eq 20 ]; then
            echo "Error: MongoDB did not start in time. Check .mongo/mongod.log for details."
            exit 1
        fi
    done
fi

# Stop our mongod instance when the script exits (skip if we didn't start it)
cleanup() {
    echo ""
    if [ -n "$MONGOD_PID" ]; then
        echo "Stopping MongoDB (PID $MONGOD_PID)..."
        kill "$MONGOD_PID" 2>/dev/null || true
        wait "$MONGOD_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# ─── Bot ────────────────────────────────────────────────────────────────────
echo "============================================"
echo "  TEST MODE"
echo "  Bot:    ${STOCKPILER_CLIENT_ID}"
echo "  Guild:  ${STOCKPILER_GUILD_ID}"
echo "  DB:     ${MONGODB_DB:-stockpiler_test} (port $MONGO_PORT)"
echo "============================================"

if [ "$1" = "--deploy" ]; then
    echo ""
    echo "Deploying commands to test guild ${STOCKPILER_GUILD_ID}..."
    npx ts-node deploy-commands.ts
    echo "Commands deployed."
    echo ""
fi

echo "Starting bot (nodemon, Ctrl+C to stop)..."
npx nodemon index.ts
