# 🐋 Ohara — Complete Project Guide
**From Zero to Production | Next.js 15 + PostgreSQL + VPS**

---

## Table of Contents
1. [What Are We Building?](#what-are-we-building)
2. [Concepts You Need To Know](#concepts-you-need-to-know)
3. [Phase 1: Local Setup](#phase-1-local-setup)
4. [Phase 2: The Database](#phase-2-the-database)
5. [Phase 3: Understanding the Codebase](#phase-3-understanding-the-codebase)
6. [Phase 4: VPS Deployment](#phase-4-vps-deployment)
7. [Phase 5: CI/CD Autopilot](#phase-5-cicd-autopilot)
8. [Phase 6: Nginx + SSL](#phase-6-nginx--ssl)
9. [Quick Reference Cheatsheet](#quick-reference-cheatsheet)

---

## What Are We Building?

**Ohara** is a portfolio + notes management app. You can:
- Upload and manage project files (stored in a real PostgreSQL database)
- Write and organize markdown notes (with vaults and folders)
- Deploy to your VPS at `ohara.laughtale.co.za`
- Run on port `3010`

The architecture is designed so that if you want to add a mobile app later (React Native/Expo), you **don't have to rewrite anything** — the mobile app just talks to the same API.

---

## Concepts You Need To Know

### 🧠 What is Next.js?
Next.js is a framework built on top of React. Think of React as the engine and Next.js as the full car — it adds routing, server-side logic, API endpoints, and build tooling.

**App Router** (what we use): The modern way to structure Next.js apps. Every folder inside `src/app/` becomes a URL route automatically.

```
src/app/
├── page.tsx          → ohara.laughtale.co.za/
├── login/
│   └── page.tsx      → ohara.laughtale.co.za/login
└── dashboard/
    └── page.tsx      → ohara.laughtale.co.za/dashboard
```

### 🧠 What is an API Route?
A file named `route.ts` inside `src/app/api/` creates a backend endpoint. Your frontend calls it, your mobile app can call it, anything can call it.

```
src/app/api/projects/route.ts
→ GET  ohara.laughtale.co.za/api/projects   (list all projects)
→ POST ohara.laughtale.co.za/api/projects   (create a project)
```

### 🧠 What is PostgreSQL?
A powerful open-source relational database. Think of it as a very organized spreadsheet that lives on your server. Instead of Prisma (which is an ORM/abstraction layer), we write raw SQL — it's more transparent and you learn what's actually happening.

### 🧠 What is `postgres.js`?
A modern npm package that lets you write SQL in JavaScript using template literals (backticks). It's lightweight, type-safe, and doesn't add magic.

```typescript
// This is what writing SQL in your code looks like
const projects = await sql`SELECT * FROM projects WHERE user_id = ${userId}`;
```

### 🧠 What is JWT?
JSON Web Token — a way to keep users logged in. When you log in, the server creates a small "ticket" (the JWT), stores it in a cookie, and checks it on every request. No passwords travel over the wire after login.

### 🧠 What is PM2?
A process manager for Node.js. It keeps your Next.js app running 24/7. If it crashes, PM2 restarts it automatically. Think of it as a babysitter for your app.

### 🧠 What is Nginx?
A web server that sits in front of your Next.js app. It handles incoming traffic and forwards it to your app on port 3010. It also handles HTTPS/SSL.

```
Internet → :443 (HTTPS) → Nginx → :3010 (Next.js)
```

### 🧠 What is CI/CD?
**Continuous Integration / Continuous Deployment** — automation that deploys your code whenever you push to GitHub. You push → GitHub runs tests → GitHub SSHs into your VPS → your app updates. Zero manual work.

### 🧠 Cross-Platform Architecture
We structure the code so business logic is separate from the UI:
- **`src/lib/`** — pure logic (database queries, auth, utilities). No React, no UI.
- **`src/app/`** — Next.js app (web UI + API routes)
- **`src/types/`** — TypeScript types shared everywhere

Later, a React Native app can import from `src/types/` and call the same API. Nothing needs to change.

---

## Phase 1: Local Setup

### 1.1 Prerequisites
Make sure you have these installed:
```bash
node --version    # Should be 20+ (use nvm if not)
npm --version     # Should be 10+
git --version     # Any recent version
psql --version    # PostgreSQL client (install PostgreSQL locally)
```

**Install PostgreSQL locally (Ubuntu/Debian):**
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
```

**Install PostgreSQL locally (macOS):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

### 1.2 Create Your GitHub Repo
1. Go to github.com → New Repository
2. Name it `ohara`
3. Make it private
4. **Do NOT** initialize with README (we'll push our own code)

### 1.3 Clone and Bootstrap the Project
```bash
# Clone the empty repo
git clone https://github.com/YOUR_USERNAME/ohara.git
cd ohara

# Copy the scaffold files into this directory
# (files from this guide)

# Install dependencies
npm install

# Copy the example env file
cp .env.example .env.local
```

### 1.4 Fill in Your `.env.local`
Open `.env.local` and fill in these values:
```env
# Database — your LOCAL PostgreSQL
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/ohara

# Auth — generate a random 32+ character string
JWT_SECRET=some-long-random-secret-change-this-please-123456

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Generating a good JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.5 Set Up the Local Database
```bash
# Create the database
createdb ohara
# Or via psql:
psql -U postgres -c "CREATE DATABASE ohara;"

# Run the migration (creates all tables)
psql -U postgres -d ohara -f migrations/001_initial.sql

# Verify tables were created
psql -U postgres -d ohara -c "\dt"
```

### 1.6 Run the Dev Server
```bash
npm run dev
```
Visit `http://localhost:3000` — you should see the Ohara login page.

**Default dev credentials** (created by the migration):
- Email: `admin@ohara.local`
- Password: `changeme123`

> ⚠️ Change these in production!

---

## Phase 2: The Database

### 2.1 Understanding the Schema
Our database has these tables:

```
users         → Login accounts
projects      → Portfolio projects
project_files → Files attached to projects (paths stored, files on disk)
notes_vaults  → Note collections (like folders in Obsidian)
notes_files   → Individual note files inside vaults
```

### 2.2 The Migration File
`migrations/001_initial.sql` creates everything. We use a `migrations` folder so changes are tracked and reproducible. Think of each `.sql` file as a "version" of your database.

### 2.3 Connecting to PostgreSQL in Code
We use `postgres.js`. The connection is set up ONCE in `src/lib/db/index.ts` and imported everywhere else:

```typescript
import sql from '@/lib/db';

// Get all projects for a user
const projects = await sql`
  SELECT * FROM projects 
  WHERE user_id = ${userId} 
  ORDER BY created_at DESC
`;
```

The `${userId}` is automatically sanitized — no SQL injection possible.

### 2.4 File Storage Strategy
Files are stored as:
- **File data** → `/var/www/ohara/uploads/` on the VPS (not in the database — databases are slow for large binary data)
- **File metadata** → `project_files` table (filename, path, size, mimetype, etc.)

This is the industry standard approach.

---

## Phase 3: Understanding the Codebase

### 3.1 Folder Structure Explained

```
ohara/
├── src/
│   ├── app/                    ← Next.js pages and API
│   │   ├── (auth)/             ← Route group: auth pages (no shared layout)
│   │   │   └── login/page.tsx  ← /login
│   │   ├── (dashboard)/        ← Route group: protected pages
│   │   │   ├── layout.tsx      ← Shared layout (checks auth)
│   │   │   └── dashboard/      ← /dashboard
│   │   └── api/                ← API endpoints
│   │       ├── auth/           ← /api/auth (login, logout)
│   │       ├── projects/       ← /api/projects (CRUD)
│   │       ├── files/          ← /api/files (upload, download)
│   │       └── notes/          ← /api/notes (vaults + files)
│   │
│   ├── components/             ← React UI components
│   │   ├── ui/                 ← Generic: Button, Input, Card, Modal
│   │   └── features/           ← Specific: ProjectCard, NotesEditor
│   │
│   ├── lib/                    ← Pure business logic (NO React)
│   │   ├── db/
│   │   │   ├── index.ts        ← Database connection singleton
│   │   │   └── queries/        ← SQL query functions
│   │   │       ├── users.ts
│   │   │       ├── projects.ts
│   │   │       └── notes.ts
│   │   └── auth/
│   │       └── index.ts        ← JWT create/verify/cookie helpers
│   │
│   └── types/
│       └── index.ts            ← ALL TypeScript interfaces live here
│
├── migrations/                 ← SQL files, one per schema version
├── public/                     ← Static assets (images, fonts)
├── .github/workflows/          ← GitHub Actions CI/CD
├── deploy.sh                   ← Server-side deployment script
├── .env.example                ← Template for environment variables
└── next.config.ts              ← Next.js configuration
```

### 3.2 How a Request Flows

**Example: User loads their projects**

```
1. Browser visits /dashboard
2. Next.js runs (dashboard)/layout.tsx
   → Checks JWT cookie
   → If no valid cookie → redirect to /login
3. dashboard/page.tsx renders
   → Calls fetch('/api/projects')
4. src/app/api/projects/route.ts handles GET request
   → Verifies JWT
   → Calls src/lib/db/queries/projects.ts → getUserProjects(userId)
   → Returns JSON array of projects
5. dashboard/page.tsx receives data → renders ProjectCard components
```

### 3.3 Adding a New Feature (Pattern)

1. **Add types** to `src/types/index.ts`
2. **Add SQL query** to `src/lib/db/queries/your-feature.ts`
3. **Add API route** to `src/app/api/your-feature/route.ts`
4. **Add UI** to `src/components/features/` and `src/app/(dashboard)/`

---

## Phase 4: VPS Deployment

### 4.1 First-Time Server Setup

SSH into your VPS:
```bash
ssh your-username@your-vps-ip
```

**Update and install basics:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw postgresql postgresql-contrib
```

**Install Node.js via NVM:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node --version  # Should show v22.x
```

**Install PM2:**
```bash
npm install -g pm2
```

### 4.2 PostgreSQL Setup on VPS

```bash
# Switch to postgres user and create your DB
sudo -u postgres psql

# Inside psql:
CREATE USER ohara_user WITH PASSWORD 'your-strong-password-here';
CREATE DATABASE ohara OWNER ohara_user;
GRANT ALL PRIVILEGES ON DATABASE ohara TO ohara_user;
\q

# Run your migration
psql -U ohara_user -d ohara -h localhost -f /var/www/ohara/migrations/001_initial.sql
```

### 4.3 Deploy the App

**Clone your repo on the VPS:**
```bash
sudo mkdir -p /var/www/ohara
sudo chown -R $USER:$USER /var/www/ohara
git clone https://github.com/YOUR_USERNAME/ohara.git /var/www/ohara
cd /var/www/ohara
```

**Create the uploads folder:**
```bash
mkdir -p /var/www/ohara/uploads
chmod 755 /var/www/ohara/uploads
```

**Create the production `.env` file:**
```bash
nano /var/www/ohara/.env
```
```env
DATABASE_URL=postgresql://ohara_user:your-strong-password@localhost:5432/ohara
JWT_SECRET=your-production-secret-from-crypto-command
NEXT_PUBLIC_APP_URL=https://ohara.laughtale.co.za
NODE_ENV=production
UPLOAD_DIR=/var/www/ohara/uploads
PORT=3010
```

**Build and start:**
```bash
cd /var/www/ohara
npm install
npm run build
pm2 start npm --name "ohara" -- start -- -p 3010
pm2 save
pm2 startup systemd
# Copy and run the command PM2 gives you
```

**Verify it's running:**
```bash
pm2 status
curl http://localhost:3010  # Should return HTML
```

### 4.4 Firewall Setup

```bash
sudo ufw allow 22/tcp        # SSH (change to your custom SSH port)
sudo ufw allow 'Nginx Full'  # Port 80 and 443
sudo ufw enable
sudo ufw status
```

> ⚠️ Do NOT allow port 3010 through the firewall. Nginx handles public traffic. Port 3010 is internal only.

---

## Phase 5: CI/CD Autopilot

### 5.1 Create an SSH Deploy Key

On your **local machine**:
```bash
ssh-keygen -t ed25519 -C "ohara-deploy" -f ~/.ssh/ohara_deploy
# Press Enter for no passphrase (so GitHub Actions can use it without prompting)
```

This creates two files:
- `~/.ssh/ohara_deploy` → **Private key** (goes into GitHub Secrets)
- `~/.ssh/ohara_deploy.pub` → **Public key** (goes onto your VPS)

**Add the public key to your VPS:**
```bash
# On your VPS:
cat >> ~/.ssh/authorized_keys << 'EOF'
# Paste the contents of ~/.ssh/ohara_deploy.pub here
EOF
chmod 600 ~/.ssh/authorized_keys
```

### 5.2 Add GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `HOST` | Your VPS public IP address |
| `USERNAME` | Your VPS username (e.g., `laughtale`) |
| `SSH_PRIVATE_KEY` | Content of `~/.ssh/ohara_deploy` (the private key file) |
| `PORT` | Your SSH port (default `22`) |

### 5.3 The deploy.yml Explained

The `.github/workflows/deploy.yml` file tells GitHub:
1. **When:** Every push to the `main` branch
2. **What:** SSH into your VPS and run `deploy.sh`

The `deploy.sh` on your VPS:
1. Pulls the latest code
2. Installs any new dependencies
3. Rebuilds the Next.js app
4. Restarts PM2 (zero-downtime)

### 5.4 Testing the Pipeline

```bash
# On your local machine:
git add .
git commit -m "test: trigger deploy pipeline"
git push origin main
```

Go to GitHub → **Actions tab** → watch the workflow run live. Green checkmark = deployed!

---

## Phase 6: Nginx + SSL

### 6.1 DNS Setup
In your domain registrar (wherever `laughtale.co.za` is managed):
- Add an **A record**: `ohara` → `your-vps-ip`
- Wait up to 24 hours for propagation (usually minutes)

**Test it:**
```bash
nslookup ohara.laughtale.co.za
# Should return your VPS IP
```

### 6.2 Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/ohara.laughtale.co.za
```

Paste this:
```nginx
server {
    listen 80;
    server_name ohara.laughtale.co.za;

    # Increase upload size limit (for file uploads)
    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable and test:**
```bash
sudo ln -s /etc/nginx/sites-available/ohara.laughtale.co.za /etc/nginx/sites-enabled/
sudo nginx -t         # Should say "syntax is ok"
sudo systemctl restart nginx
```

### 6.3 SSL with Let's Encrypt (Free HTTPS)

```bash
sudo apt install python3-certbot-nginx -y
sudo certbot --nginx -d ohara.laughtale.co.za
# Follow the prompts — choose to redirect HTTP to HTTPS
```

Certbot automatically updates your Nginx config and sets up auto-renewal. Your site is now live at `https://ohara.laughtale.co.za`.

---

## Quick Reference Cheatsheet

### Local Development
```bash
npm run dev          # Start dev server on :3000
npm run build        # Build for production
npm run lint         # Check for code errors
```

### Database
```bash
# Connect to local DB
psql -U postgres -d ohara

# Run a new migration
psql -U postgres -d ohara -f migrations/002_your_change.sql

# On VPS
psql -U ohara_user -d ohara -h localhost
```

### PM2 (on VPS)
```bash
pm2 status                    # See all running apps
pm2 logs ohara                # Live logs
pm2 restart ohara             # Restart the app
pm2 stop ohara                # Stop the app
pm2 monit                     # Real-time CPU/memory dashboard
```

### Nginx (on VPS)
```bash
sudo nginx -t                            # Test config
sudo systemctl restart nginx             # Apply config changes
sudo tail -f /var/log/nginx/error.log    # Watch error logs
```

### Common Fixes

| Problem | Solution |
|---------|----------|
| App won't start | Check `pm2 logs ohara` for errors |
| 502 Bad Gateway | App isn't running — `pm2 restart ohara` |
| DB connection error | Check `DATABASE_URL` in `.env` |
| GitHub Action fails: Timeout | Check UFW allows your SSH port |
| GitHub Action fails: Handshake | Public key in `~/.ssh/authorized_keys` on VPS? |
| `npm: command not found` in deploy | The NVM export lines in deploy.yml fix this |
| File upload fails | Check `UPLOAD_DIR` path exists and has write permissions |

---

## 🎉 You're Done!

Your stack is:
- **Next.js 15** with App Router
- **PostgreSQL** with raw SQL via `postgres.js`
- **JWT** authentication (no magic libraries)
- **PM2** keeping it alive forever
- **Nginx** as the gateway
- **GitHub Actions** deploying on every push

The code is structured so adding a React Native mobile app later means:
1. Create a new `apps/mobile/` directory
2. Point it at the same `https://ohara.laughtale.co.za/api/` endpoints
3. Import shared types from `src/types/`

Nothing in the backend needs to change. 🚀
