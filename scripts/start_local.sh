#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting StatWoX Local Development Environment...${NC}"

# Ensure Node.js 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

# Setup .env if missing
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file with defaults...${NC}"
    cat <<EOF > .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/statwox"
JWT_SECRET="local-dev-secret-do-not-use-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:8000"
EOF
    echo -e "${GREEN}✅ .env created. Edit it if you have a remote DB URL.${NC}"
fi

# Try Docker DB if available, otherwise skip
if docker info > /dev/null 2>&1; then
    echo -e "${BLUE}📦 Starting local Postgres via Docker...${NC}"
    docker-compose up -d db 2>/dev/null || true
    sleep 3
    echo -e "${BLUE}🔄 Running migrations...${NC}"
    npx prisma generate
    npx prisma db push --accept-data-loss 2>/dev/null || true
else
    echo -e "${YELLOW}⚠️  Docker not available. Skipping local DB setup.${NC}"
    echo -e "${YELLOW}   Make sure DATABASE_URL in .env points to a valid Postgres instance.${NC}"
    echo -e "${YELLOW}   The app will start but DB-dependent features won't work without a database.${NC}"
    npx prisma generate 2>/dev/null || true
fi

# Start dev server on port 8000
echo ""
echo -e "${GREEN}🚀 Starting Next.js on http://localhost:8000${NC}"
npm run dev
