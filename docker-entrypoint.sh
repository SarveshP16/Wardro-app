#!/bin/sh
set -e

# Applies any pending Prisma migrations against $DATABASE_URL, then
# starts the app. Runs on every container start -- a no-op once the
# schema is already up to date.
npx prisma migrate deploy

exec npm run start
