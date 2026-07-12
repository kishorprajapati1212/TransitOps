# 🚀 Deploy TransitOps Live — Step by Step

Three options from easiest to most control. **Option 1 is recommended** — your app will be live in ~10 minutes with zero cost.

---

## Option 1: Render.com (Easiest — 100% Free)

Render gives you a free PostgreSQL database + free web services. No credit card needed.

### Step 1 — Push code to GitHub
```bash
# If not already on GitHub:
git init
git add .
git commit -m "TransitOps v1.0"
git remote add origin https://github.com/YOUR_USERNAME/TransitOps.git
git push -u origin main
```

### Step 2 — Create free PostgreSQL on Render
1. Go to [render.com](https://render.com) → Sign up (use GitHub)
2. Click **New +** → **PostgreSQL**
3. Fill in:
   - Name: `transitops-db`
   - Database: `transitops`
   - User: `transitops`
   - Region: Singapore (closest to India)
   - Plan: **Free**
4. Click **Create Database**
5. Wait ~1 min, then copy the **Internal Database URL** (looks like `postgres://transitops:xxxx@dpg-xxxx/transitops`)

### Step 3 — Deploy Backend on Render
1. Click **New +** → **Web Service**
2. Connect your GitHub repo → select `TransitOps`
3. Fill in:
   - Name: `transitops-api`
   - Region: Singapore
   - Root Directory: `backend`
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `npm run db:migrate && npm run db:seed && node server.js`
   - Plan: **Free**
4. Add **Environment Variables**:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(paste the Internal Database URL from Step 2)* |
   | `JWT_SECRET` | `my-super-secret-key-change-this-123` |
   | `PORT` | `4000` |
   | `NODE_ENV` | `production` |
5. Click **Create Web Service**
6. Wait for deploy (~2-3 min). Note the URL: `https://transitops-api-xxxx.onrender.com`

### Step 4 — Deploy Frontend on Render
1. Click **New +** → **Static Site**
2. Connect same GitHub repo
3. Fill in:
   - Name: `transitops-app`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Add **Environment Variable**:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://transitops-api-xxxx.onrender.com/api` *(your backend URL + /api)* |
5. Under **Redirects/Rewrites** add:
   - Source: `/*` → Destination: `/index.html` → Action: **Rewrite**
   - Source: `/api/*` → Destination: `https://transitops-api-xxxx.onrender.com/api/*` → Action: **Rewrite**
6. Click **Create Static Site**

### ✅ Done!
Your app is live at: `https://transitops-app-xxxx.onrender.com`

> **Note:** Free Render services sleep after 15 min of inactivity. First request after sleep takes ~30s to wake up. This is fine for hackathon demos.

---

## Option 2: Railway.app (Easiest Docker Deploy — Free $5 credit)

Railway runs Docker directly — closest to your local Docker setup.

### Step 1 — Push to GitHub (same as above)

### Step 2 — Deploy on Railway
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub Repo** → select `TransitOps`
3. Railway auto-detects `docker-compose.yml` — click **Deploy**
4. Railway will create 3 services: `db`, `backend`, `frontend`
5. Click on `frontend` service → **Settings** → **Networking** → **Generate Domain**
6. Copy the public URL

### Step 3 — Set Environment Variables
Click on `backend` service → **Variables** → Add:
| Key | Value |
|-----|-------|
| `JWT_SECRET` | `your-secret-key-here` |
| `DATABASE_URL` | *(Railway auto-fills this from the db service)* |

### ✅ Done!
Your app is live at the generated Railway URL.

---

## Option 3: VPS with Docker (Full Control)

For a DigitalOcean/AWS/any VPS ($4-6/month).

### Step 1 — Get a VPS
- DigitalOcean: Create a $4/month Ubuntu droplet
- Or any VPS with Docker installed

### Step 2 — Install Docker
```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
```

### Step 3 — Clone and Run
```bash
git clone https://github.com/YOUR_USERNAME/TransitOps.git
cd TransitOps

# Edit the JWT secret
sed -i 's/dev-secret-change-me/your-production-secret-key/g' docker-compose.yml

# Start everything
docker compose up -d --build

# Check logs
docker compose logs -f
```

### Step 4 — Open Firewall
```bash
ufw allow 8080    # Frontend
ufw allow 4000    # Backend API (optional, frontend proxies)
```

### ✅ Done!
Your app is live at: `http://YOUR_SERVER_IP:8080`

---

## Quick Reference — Environment Variables

| Variable | Where | Required | Example |
|----------|-------|----------|---------|
| `DATABASE_URL` | Backend | ✅ | `postgres://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Backend | ✅ | `any-long-random-string` |
| `PORT` | Backend | ❌ | `4000` (default) |
| `NODE_ENV` | Backend | ❌ | `production` |
| `VITE_API_URL` | Frontend (build-time) | ❌ | `/api` (default, or full backend URL) |

---

## After Deployment Checklist

- [ ] Open the URL → you should see the Landing page
- [ ] Click "Sign in" → login with `admin@transitops.io` / `password123`
- [ ] Check Dashboard loads with KPIs and charts
- [ ] Create a vehicle, driver, and trip to verify full workflow
- [ ] Try dark mode toggle
- [ ] Test on mobile screen size
