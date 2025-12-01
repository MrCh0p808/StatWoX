# Deployment Guide for StatWoX (AWS Serverless)

This guide covers how to deploy the StatWoX application to AWS using Terraform.

## Prerequisites

- **Terraform** (v1.0+)
- **AWS CLI** (Configured with Administrator access)
- **Node.js** (v18+)
- **Google Cloud Console Project** (for OAuth Client ID)

---

## 1. Configuration

### Environment Variables
Create a `.envrc` file in the `infra/` directory (or set these in your shell):

```bash
export TF_VAR_db_url="postgresql://user:password@host:5432/statwox?sslmode=require"
export TF_VAR_jwt_secret="your-super-secret-jwt-key"
export TF_VAR_google_client_id="your-google-client-id"
export TF_VAR_db_username="admin"
export TF_VAR_db_password="your-secure-password"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
```

> **Note**: You need an external PostgreSQL database (e.g., Neon, Supabase, or RDS).

---

## 2. Build Artifacts

Before deploying infrastructure, we need to build the application code.

### Backend (Lambda)
```bash
cd backend
npm install
npm run build
# Creates dist/lambda.js and copies Prisma engines
```

### Frontend (Static Assets)
```bash
cd frontend
npm install
npm run build
# Creates dist/ containing index.html and assets
```

---

## 3. Deploy Infrastructure

Navigate to the infrastructure directory:

```bash
cd infra
```

### Initialize Terraform
```bash
terraform init
```

### Plan Deployment
```bash
terraform plan -out=tfplan
```
Review the plan to ensure it creates the expected resources (Lambda, API Gateway, CloudFront, S3).

### Apply Deployment
```bash
terraform apply tfplan
```

---

## 4. Post-Deployment

Terraform will output two critical values:
1.  **`api_url`**: The URL of your API Gateway.
2.  **`cdn_url`**: The CloudFront domain for your frontend.

Terraform automatically generates a `config.js` file and uploads it to S3, injecting the `api_url` into your frontend.

### Verify
1.  Visit the **`cdn_url`** in your browser.
2.  Try logging in with Google.
3.  Check CloudWatch Logs if you encounter backend errors.

---

## 5. Database Migration
Ensure your production database schema is up to date:

```bash
cd backend
export DATABASE_URL="your-production-db-url"
npx prisma db push
```

---

## 6. Troubleshooting & Health Checks

If you are unsure if your deployment is working, use these tools:

### A. API Health Endpoint
Your deployed API has a health check route that verifies the database connection.
- **URL**: `https://<your-api-url>/api/health`
- **Success Response**: `{"status":"ok", "database":"connected", ...}`
- **Failure Response**: `{"status":"error", "database":"disconnected", ...}`

### B. Manual DB Check (CLI)
You can run a manual health check script from your local machine (if you have the `.env` set up):

```bash
cd backend
node scripts/healthcheck.js
```

This will attempt to connect to the database defined in your `DATABASE_URL` and run a test query.

---
**Deployment Complete!** 🚀
