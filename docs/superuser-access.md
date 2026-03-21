# Superuser Access

> Last verified against codebase: 2026-03-21

Use the CLI command below to grant or revoke admin access for a user profile.

## Grant Access

By email:

```bash
npm run db:set-superuser -- --email you@example.com
```

By Supabase user ID:

```bash
npm run db:set-superuser -- --user-id your-supabase-user-id
```

## Revoke Access

```bash
npm run db:set-superuser -- --email you@example.com --revoke
```

## Notes

- The command loads `.env.local`, so `DATABASE_URL` must be set.
- Email lookup also needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- The user must already have a row in `profiles`. If not, have them sign in and save their profile once, then run the command again.
- Show command help with:

```bash
npm run db:set-superuser -- --help
```
