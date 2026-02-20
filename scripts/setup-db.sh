#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting StatWoX Local Environment Setup..."

# Check if running in WSL
if grep -q "microsoft" /proc/version; then
    echo "📦 Detected WSL environment."
else
    echo "⚠️ This script is optimized for Ubuntu/WSL. It may not work perfectly on your current OS."
fi

# 1. Check for PostgreSQL installation
if ! command -v psql &> /dev/null; then
    echo "⚙️ PostgreSQL could not be found. Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
else
    echo "✅ PostgreSQL is already installed."
fi

# 2. Check if PostgreSQL service is running
echo "🔄 Starting PostgreSQL service..."
sudo service postgresql start || echo "PostgreSQL might already be running."

# Wait a moment for the service to fully boot
sleep 2

# 3. Configure the database and user
echo "🛠️ Configuring 'postgres' user and 'statwox' database..."

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"

# Check if database exists, create if it doesn't
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw statwox; then
    echo "✅ Database 'statwox' already exists."
else
    echo "🏗️ Creating database 'statwox'..."
    sudo -u postgres createdb statwox
fi

# 4. Initialize Prisma Schema
echo "🔗 Pushing Prisma Schema to database..."
bun run db:push

# 5. Seed initial demo data
echo "🌱 Seeding initial demo credentials..."
bun run db:seed

echo "✨ Local environment setup complete! You can now run 'bun run dev'"
