#!/bin/bash
# ============================================================
# deploy.sh — Ohara Deployment Script
# Runs ON the VPS when triggered by GitHub Actions.
#
# Usage: ./deploy.sh
# Make executable: chmod +x deploy.sh
# ============================================================

set -e  # Exit immediately if any command fails

# Load NVM (needed because GitHub Actions SSH sessions don't
# load your .bashrc automatically)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

PROJECT_DIR="/var/www/ohara"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐋 Ohara Deployment Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_DIR"

# ── 1. Pull latest code ───────────────────────────────────────
echo ""
echo "📥 Pulling latest code from main..."
git pull origin main

# ── 2. Install dependencies ───────────────────────────────────
echo ""
echo "📦 Installing dependencies..."
# --omit=dev skips devDependencies in production (faster + smaller)
npm ci --omit=dev

# ── 3. Build the Next.js app ──────────────────────────────────
echo ""
echo "🔨 Building application..."
npm run build

# ── 4. Run any new database migrations ───────────────────────
# Only runs if there are migration files newer than our tracking file
echo ""
echo "🗃️  Checking for new migrations..."
if [ -f "$PROJECT_DIR/.last_migration" ]; then
  LAST=$(cat "$PROJECT_DIR/.last_migration")
else
  LAST="0"
fi

for migration in "$PROJECT_DIR"/migrations/*.sql; do
  MIGRATION_NUM=$(basename "$migration" | sed 's/[^0-9].*//')
  if [ "$MIGRATION_NUM" -gt "$LAST" ]; then
    echo "   Running migration: $(basename $migration)"
    psql -d "$DATABASE_URL" -f "$migration"
    echo "$MIGRATION_NUM" > "$PROJECT_DIR/.last_migration"
  fi
done

# ── 5. Restart the app ────────────────────────────────────────
echo ""
echo "🔄 Restarting PM2..."
# If the app is already running, restart it.
# If it's not running (first deploy), start it.
pm2 restart ohara --update-env 2>/dev/null || \
  pm2 start npm --name "ohara" -- start -- -p 3010

# Save PM2 state so it survives server reboots
pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "   Live at: https://ohara.laughtale.co.za"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
