#!/bin/bash
set -e

echo "🚀 Starting Deployment..."

# Ensure Node.js 20 is used
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20

# 1. Build the Lambda artifact
echo "📦 Building Next.js implementation..."
bash deployment/scripts/build_lambda.sh

# 2. Deploy Infrastructure
echo "☁️ Deploying Infrastructure with Terraform..."
cd infra

# Initialize Terraform (safe to run multiple times)
terraform init

# Apply changes
# Note: dealing with potential existing state or fresh deploy
if [ "$1" == "prod" ]; then
    echo "⚠️ Deploying to PROD..."
    terraform apply -auto-approve -var="environment=prod"
else
    echo "ℹ️ Deploying to DEV (default)..."
    terraform apply -auto-approve
fi

echo "✅ Deployment Complete!"
echo "👉 Check CloudFront URL in outputs."
