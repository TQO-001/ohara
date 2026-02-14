#!/bin/bash
# ============================================================
# deploy.sh — Ohara Deployment Script
# Runs ON the VPS when triggered by GitHub Actions.
# ============================================================

set -e  # Exit immediately if any command fails

# 1. Define paths first
PROJECT_DIR="/var/www/ohara"
export NVM_DIR="$HOME/.nvm"

# 2. Load NVM
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. Load production environment variables (Crucial for DATABASE_URL)
if [ -f "$PROJECT_DIR/.env" ]; then
  # This exports variables from .env so the script and psql can see them
  export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐋 Ohara Deployment Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_DIR"

# ── 1. Sync code with GitHub ──────────────────────────────────
echo ""
echo "📥 Fetching latest code and forcing reset..."
# We use reset --hard so that manual changes on the server 
# don't block the deployment.
git fetch origin main
git reset --hard origin/main

# ── 2. Install dependencies ───────────────────────────────────
echo ""
echo "📦 Installing dependencies..."
npm ci --omit=dev

# ── 3. Build the Next.js app ──────────────────────────────────
echo ""
echo "🔨 Building application..."
npm run build

# ── 4. Run any new database migrations ───────────────────────
echo ""
echo "🗃️  Checking for new migrations..."
if [ -f "$PROJECT_DIR/.last_migration" ]; then
  LAST=$(cat "$PROJECT_DIR/.last_migration")
else
  LAST="0"
fi

# Ensure migrations directory exists before looping
if [ -d "$PROJECT_DIR/migrations" ]; then
  for migration in "$PROJECT_DIR"/migrations/*.sql; do
    # Skip if no .sql files exist
    [ -e "$migration" ] || continue

    MIGRATION_NUM=$(basename "$migration" | sed 's/[^0-9].*//')
    
    if [ "$MIGRATION_NUM" -gt "$LAST" ]; then
      echo "   Running migration: $(basename "$migration")"
      # -d allows passing the full connection string URI
      psql -d "$DATABASE_URL" -f "$migration"
      echo "$MIGRATION_NUM" > "$PROJECT_DIR/.last_migration"
    fi
  done
else
  echo "   No migrations directory found, skipping."
fi

# ── 5. Restart the app ────────────────────────────────────────
echo ""
echo "🔄 Restarting PM2..."
# If the app is already running, restart it. 
# If not, start it fresh on port 3010.
pm2 restart ohara --update-env 2>/dev/null || \
  pm2 start npm --name "ohara" -- start -- -p 3010

# Save PM2 state so it survives server reboots
pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "   Live at: https://ohara.laughtale.co.za"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"