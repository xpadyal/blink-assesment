## Blink – AI Voice Keyboard

Setup

1) Install deps

```bash
npm install
```

2) Set env vars

Create `.env`:

```

```

3) Prisma

```bash
npx prisma migrate dev --name init
```

4) Dev

```bash
npm run dev
```

Deployment (Railway)

- Provision Postgres
- Set env vars above
- Build command: `npm run build`
- Start command: `npm run start`


