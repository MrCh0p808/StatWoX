#!/bin/bash
set -e

# Directory setup
ROOT_DIR=$(pwd)
DIST_DIR="$ROOT_DIR/dist"
LAMBDA_DIR="$DIST_DIR/lambda"
ASSETS_DIR="$DIST_DIR/assets"

echo "🧹 Cleaning previous build..."
rm -rf .next
rm -rf "$DIST_DIR"

echo "🏗️  Building Next.js app..."
# Ensure dependencies are installed
# bun install 
# Build standalone
export JWT_SECRET="build-time-secret"
export DATABASE_URL="postgresql://build:build@localhost:5432/build"
export NEXT_PUBLIC_APP_URL="http://localhost:3000"

npm run build

echo "📦 Packaging for Lambda..."
mkdir -p "$LAMBDA_DIR"
mkdir -p "$ASSETS_DIR"

# 1. Prepare Lambda Artifact
# Copy standalone output
cp -r .next/standalone/* "$LAMBDA_DIR"
mkdir -p "$LAMBDA_DIR/.next"
cp -r .next/static "$LAMBDA_DIR/.next/static"
cp -r public "$LAMBDA_DIR/public"

# Create run.sh for AWS Lambda Adapter
cat <<EOF > "$LAMBDA_DIR/run.sh"
#!/bin/bash
exec node server.js
EOF
chmod +x "$LAMBDA_DIR/run.sh"

# 2. Prepare Static Assets for S3
# Move static assets to assets dir
cp -r public/* "$ASSETS_DIR/" 2>/dev/null || true
mkdir -p "$ASSETS_DIR/_next"
cp -r .next/static "$ASSETS_DIR/_next/"

echo "✅ Build complete!"
echo "Lambda artifact: $LAMBDA_DIR"
echo "Static assets: $ASSETS_DIR"
