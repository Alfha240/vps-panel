# Fix Prisma Client Generation

Due to a Windows file locking issue, follow these steps:

## Option 1: Quick Fix (Recommended)
1. Stop the dev server (Ctrl+C in terminal)
2. Run: `npx prisma generate`
3. Restart dev server: `npm run dev`

## Option 2: Alternative
1. Close all terminals running the dev server
2. Wait 5-10 seconds
3. Run: `npx prisma generate`
4. Start dev server: `npm run dev`

## What This Fixes
- Updates Prisma Client with new schema changes
- Adds support for `name` field in IpPool
- Adds `templateId` to Server model
- Adds `nodeId` to IpPool model

## If Still Getting Errors
The Prisma client needs to be regenerated after schema changes. The dev server on Windows locks the query engine file, preventing regeneration.

**Quick check after regenerating:**
The error "Unknown argument `name`" should disappear after successful generation.
