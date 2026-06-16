#!/bin/sh

echo "Waiting for database to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting API..."
node dist/server.js