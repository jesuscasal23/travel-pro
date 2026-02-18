# API Key / Secret Rotation Checklist

> Triggered by: `/api/health` endpoint was publicly exposing partial keys and infrastructure details.
> Date identified: 2026-02-18

---

## 1. ANTHROPIC_API_KEY (rotate)

**What was leaked:** First 10 characters of the key
**Risk:** Confirms key format/prefix, narrows brute-force search space

**Steps:**
1. Go to https://console.anthropic.com/ -> API Keys
2. Create a new key
3. Update `.env.local` locally
4. Update the env var in your deployment platform (Vercel / etc.)
5. Revoke the old key (do this AFTER deploying with the new one)

---

## 2. DATABASE_URL password (rotate)

**What was leaked:** Database hostname (extracted from the connection string)
**Risk:** Attacker knows exactly where to target connection attempts

**Steps:**
1. Go to Supabase Dashboard -> Settings -> Database -> Connection string
2. Click "Reset database password"
3. Copy the new connection string
4. Update `DATABASE_URL` in `.env.local`
5. Update the env var in your deployment platform
6. Run a quick `npx prisma db pull` to verify the new connection works

---

## 3. SUPABASE_SERVICE_ROLE_KEY (optional, recommended)

**What was leaked:** Not directly printed, but the health endpoint used it in a server-side fetch to the Supabase REST API
**Risk:** Low unless server logs were also exposed

**Steps:**
1. Go to Supabase Dashboard -> Settings -> API
2. Under "service_role key", click regenerate
3. Update `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
4. Update the env var in your deployment platform

---

## 4. NEXT_PUBLIC_SUPABASE_URL (no action needed)

The `NEXT_PUBLIC_` prefix means this is bundled into client-side JS by design. It is already public. No rotation needed.

---

## After rotation

- [ ] Deploy with the new env vars
- [ ] Verify `/api/health` returns `{ "healthy": true }` with no sensitive details
- [ ] Delete this file once all rotations are complete
