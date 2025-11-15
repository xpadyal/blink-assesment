# Railway 502 Error Troubleshooting

## Common Causes of 502 Errors

### 1. Missing Environment Variables

**Check in Railway Dashboard → Variables tab:**

Required variables:
- ✅ `DATABASE_URL` - Must be set (Railway auto-generates if you added Postgres service)
- ✅ `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- ✅ `NEXTAUTH_URL` - Must be your Railway app URL (e.g., `https://your-app.railway.app`)
- ✅ `DEEPGRAM_API_KEY` - Your Deepgram API key
- ✅ `DEEPGRAM_PROJECT_ID` - Your Deepgram project ID

**Critical:** `NEXTAUTH_URL` must match your Railway domain exactly (including https://)

### 2. Database Migrations Not Running

**IMPORTANT:** Migrations must run in the **pre-deploy phase**, NOT during build, because the database is only accessible after the build completes.

**Correct Solution - Use Railway's preDeployCommand:**
In `railway.json`:
```json
{
  "deploy": {
    "preDeployCommand": "npx prisma migrate deploy",
    "startCommand": "npm start"
  }
}
```

**Build command should NOT include migrations:**
```
npm ci && npm run postinstall && npm run build
```

**Why pre-deploy?** Railway's private network is available during pre-deploy, but not during build. Pre-deploy runs after build but before the container starts.

### 3. Build Failures

**Check Railway logs:**
1. Go to Railway Dashboard → Your Service → Deployments
2. Click on the latest deployment
3. Check "Build Logs" for errors

Common build errors:
- TypeScript errors
- Missing dependencies
- Prisma client not generated

### 4. Port Configuration

Railway automatically sets `PORT` environment variable. Next.js should use it automatically, but if not:

Update `package.json` start script:
```json
"start": "next start -p $PORT"
```

### 5. Database Connection Issues

**IMPORTANT: Setting DATABASE_URL in Railway**

If you have a PostgreSQL service in Railway, you MUST use a **Reference Variable** to link it:

1. **Go to your App Service** (not the database service)
2. **Click Variables tab**
3. **Add New Variable:**
   - **Name:** `DATABASE_URL`
   - **Value:** `${{ PostgreSQL.DATABASE_URL }}`
   - (Replace `PostgreSQL` with your actual database service name)

**How to find your database service name:**
- Go to your Railway project
- Look at the service list - your PostgreSQL service will have a name (e.g., "Postgres", "PostgreSQL", "database")
- Use that exact name in the reference variable

**Example:**
If your database service is named "Postgres", use:
```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
```

**Alternative: If database is in a different project:**
1. Go to your PostgreSQL service → Variables tab
2. Copy the `DATABASE_URL` value
3. Go to your app service → Variables tab
4. Add `DATABASE_URL` with the copied value

**Check:**
- Database service is running
- `DATABASE_URL` is correctly set using reference variable syntax
- Database is accessible from Railway's network
- Migrations have been run

### 6. NextAuth trustHost Issue

If you see "UntrustedHost" errors, ensure:
- `NEXTAUTH_URL` is set correctly
- `trustHost` is `false` in production (already configured)

## Quick Fix Steps

1. **Check Railway Logs:**
   - Dashboard → Service → Logs tab
   - Look for error messages

2. **Verify Environment Variables:**
   - Dashboard → Variables tab
   - Ensure all required vars are set

3. **Run Migrations Manually:**
   - Use Railway CLI: `railway run npm run migrate:deploy`
   - Or add to start command temporarily

4. **Check Build Logs:**
   - Dashboard → Deployments → Latest → Build Logs
   - Fix any build errors

5. **Redeploy:**
   - After fixing issues, trigger a new deployment

## Railway Configuration

**Build Command (NO migrations here):**
```
npm ci && npm run postinstall && npm run build
```

**Start Command (migrations run here at runtime):**
```
npm run migrate:deploy && npm start
```

**Why?** The database connection is only available at runtime, not during the build phase.

## Testing Locally

Before deploying, test production build locally:

```bash
# Set production env vars
export DATABASE_URL="your-production-db-url"
export NEXTAUTH_SECRET="your-secret"
export NEXTAUTH_URL="http://localhost:3000"
export DEEPGRAM_API_KEY="your-key"
export DEEPGRAM_PROJECT_ID="your-project-id"

# Build and start
npm run build
npm run migrate:deploy
npm start
```

If it works locally, it should work on Railway.

