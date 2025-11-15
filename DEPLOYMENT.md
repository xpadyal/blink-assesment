# Production Deployment Checklist

## Pre-Deployment

- [ ] **Environment Variables**
  - [ ] `DATABASE_URL` - Production PostgreSQL connection string
  - [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`
  - [ ] `NEXTAUTH_URL` - Exact production URL (e.g., `https://yourdomain.com`)
  - [ ] `DEEPGRAM_API_KEY` - Deepgram API key
  - [ ] `DEEPGRAM_PROJECT_ID` - Deepgram project ID

- [ ] **Database**
  - [ ] Production PostgreSQL database provisioned
  - [ ] Connection string tested
  - [ ] Migrations ready to deploy

- [ ] **Security**
  - [ ] `NEXTAUTH_SECRET` is strong and unique
  - [ ] HTTPS enabled (required for NextAuth)
  - [ ] `NEXTAUTH_URL` matches production domain exactly
  - [ ] Environment variables secured (not in code)

## Deployment Steps

### 1. Build
```bash
npm ci
npm run postinstall
npm run build
```

### 2. Database Migrations
```bash
npm run migrate:deploy
```

### 3. Start Server
```bash
npm start
```

## Platform-Specific

### Railway
1. Connect GitHub repository
2. Provision PostgreSQL service
3. Add all environment variables
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Deploy and verify migrations ran

### Vercel
1. Import project from GitHub
2. Add environment variables
3. Add PostgreSQL (Vercel Postgres or external)
4. Build settings:
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Deploy
6. Run migrations via Vercel CLI or add to build

### Docker
1. Build image: `docker build -t blink .`
2. Run container with env vars
3. Run migrations inside container or separately
4. Expose port 3000

## Post-Deployment Verification

- [ ] Homepage loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] Dictation page accessible
- [ ] Deepgram token endpoint works
- [ ] Settings page loads
- [ ] Database queries work
- [ ] No console errors

## Monitoring

- [ ] Application logs accessible
- [ ] Database connection monitoring
- [ ] Error tracking configured (optional)
- [ ] Performance monitoring (optional)

## Rollback Plan

1. Keep previous deployment version
2. Revert environment variables if needed
3. Database migrations are reversible (if needed)

