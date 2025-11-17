<div align="center">

<h1><b>StatWoX : Surveys / Forms / Polls</b></h1>
<h3><b><i>Let The Stat Work Out Your Decision Making</i></b></h3>

<img src="https://img.shields.io/badge/Build-passing-brightgreen" />
<img src="https://img.shields.io/badge/Version-1.0.0-blue" />
<img src="https://img.shields.io/badge/PRs-welcome-green" />
<img src="https://img.shields.io/badge/Powered_by-AWS-orange" />
<img src="https://img.shields.io/badge/MVP-1.0.0-teal" />

<br/>

<img src="https://img.shields.io/badge/React-19-61DAFB" />
<img src="https://img.shields.io/badge/TypeScript-5-blue" />
<img src="https://img.shields.io/badge/Prisma-ORM-3982CE" />
<img src="https://img.shields.io/badge/Node-20-green" />
<img src="https://img.shields.io/badge/AWS-Lambda-orange" />
<img src="https://img.shields.io/badge/AWS-API_Gateway-orange" />
<img src="https://img.shields.io/badge/Terraform-IaC-7B42BC" />
<img src="https://img.shields.io/badge/Architecture-Serverless-black" />
<img src="https://img.shields.io/badge/PostgreSQL-DB-336791" />

<img src="https://img.shields.io/badge/Made_by-V3nd377a_73C0rp-black" />
<img src="https://img.shields.io/badge/License-MIT-purple" />
</div>

<br>

A modern open source forms and surveys platform that works like Google Forms mixed with Typeform but with a cleaner developer experience and a fully serverless backend.

Built with React, Express, Prisma, AWS Lambda, API Gateway, S3, CloudFront, and Terraform.

Spin up surveys, share them instantly, collect responses, view insights, save responses to your GDrive or Local.

Simple idea. Sharp execution.

---

## **Visit StatWoX Surveys (Work In Progress)**

> Link inside repo description.

---

# **Table of Contents**

* [What StatWoX Does](#what-statwox-does)
* [Architecture Diagram](#architecture-diagram)
* [Detailed Architecture Breakdown](#detailed-architecture-breakdown)
* [Variable Flow Diagram](#variable-flow-diagram)
* [User Flow](#user-flow)
* [Tech Stack](#tech-stack)
* [Local Setup Guide](#local-setup-guide)
* [Production Deployment Terraform](#production-deployment-terraform)
* [API Reference](#api-reference)
* [Contributing Guide](#contributing-guide)
* [Changelog](#changelog)

---

# **What StatWoX Does**

StatWoX is a full stack survey system with:

* Authentication system
* Dashboard for My Surveys
* Public Home Feed
* Create Survey or Poll
* Serverless backend with Express inside Lambda
* PostgreSQL database through Prisma
* Fully CDN hosted frontend
* Terraform based infrastructure

Scalable from day one.

---

# **Architecture Diagram**

Full system diagram showing all moving parts.

```mermaid
flowchart TD

    subgraph UserSide
        U[User Browser]
        LS[LocalStorage Token]
    end

    subgraph Frontend
        FE[React App - Vite Build]
        CFG[config.js API URL Injection]
        CDN[CloudFront CDN]
        S3[S3 Static Site Bucket]
    end

    subgraph Backend
        APIGW[API Gateway HTTP API]
        LAMBDA[Lambda Function with Express]
        EXPRESS[Express App Router]
        AUTHMW[Auth Middleware JWT Verify]
        PRISMA[Prisma Client]
        POSTGRES[(PostgreSQL DB)]
    end

    subgraph Infra
        TF[Terraform Modules]
        IAM[IAM Roles and Policies]
        OAC[Origin Access Control]
    end

    U --> FE
    FE --> CFG
    FE --> CDN --> S3
    FE --> APIGW
    APIGW --> LAMBDA
    LAMBDA --> EXPRESS
    EXPRESS --> AUTHMW
    EXPRESS --> PRISMA
    PRISMA --> POSTGRES

    TF --> APIGW
    TF --> LAMBDA
    TF --> S3
    TF --> CDN
    TF --> IAM
    CDN --> OAC
```

---

# **Detailed Architecture Breakdown**

### **Frontend**

* Built with React 19
* Bundled by Vite
* Tailwind loaded via CDN
* Entire static site hosted in S3
* Served globally through CloudFront
* API_URL injected through config.js at deploy time
* Uses localStorage for JWT token caching

### **Backend**

* Express.js running inside AWS Lambda
* Serverless HTTP wrapper
* JWT authentication for user sessions
* Prisma client handles DB access
* PostgreSQL remote instance
* API Gateway handles all routing via `$default` catch all

### **Infrastructure**

* Terraform provisions everything
* Zero public S3 access
* CloudFront OAC signed access
* Lambda zipped using archive_file
* IAM roles created for Lambda execution
* Database URL and JWT secret stored as env vars inside Lambda

### **Build Flow**

* `Vite build` outputs `dist/` with static assets
* Terraform uploads them to S3 using dynamic fileset
* Backend build creates lambda.js via esbuild
* Zip is created and deployed as Lambda function source
* Terraform outputs API URL and CloudFront domain

---

# **Variable Flow Diagram**

```mermaid
flowchart LR
    FE[Frontend] --> CONFIG[config.js]
    CONFIG --> APIURL[API Gateway Endpoint]
    FE --> TOKEN[LocalStorage Token]
    TOKEN --> HeaderAuth[Authorization Header]
    HeaderAuth --> Lambda
    Lambda --> EnvVars[(DATABASE_URL and JWT_SECRET)]
    EnvVars --> Postgres[(PostgreSQL)]
```

---

# **User Flow**

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as API Gateway
    participant L as Lambda API
    participant DB as PostgreSQL

    U->>FE: Load StatWoX App
    FE->>U: Render Login or Dashboard
    U->>FE: Submit Credentials
    FE->>API: POST /api/auth/login
    API->>L: Invoke Lambda
    L->>DB: Validate User
    DB-->>L: User Loaded
    L-->>FE: JWT Token
    FE->>LS: Save Token

    U->>FE: Visit My Surveys
    FE->>API: GET /api/surveys
    API->>L: Pass Bearer Token
    L->>DB: Fetch Surveys
    DB-->>L: Survey Data
    L-->>FE: Return JSON
```

---

Say less. Clean table. All badges. GitHub safe.

---

# **Tech Stack**

| Category           | Tools                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF) ![Tailwind](https://img.shields.io/badge/TailwindCSS-Utility_First-38BDF8) ![CloudFront](https://img.shields.io/badge/CloudFront-CDN-orange) ![S3](https://img.shields.io/badge/S3-Static_Hosting-red) |
| **Backend**        | ![Express](https://img.shields.io/badge/Express.js-Server-lightgrey) ![Node](https://img.shields.io/badge/Node-20-green) ![Prisma](https://img.shields.io/badge/Prisma-ORM-3982CE) ![Bcrypt](https://img.shields.io/badge/BCryptJS-Hashing-yellow) ![JWT](https://img.shields.io/badge/JWT-Auth-blueviolet)                                                                           |
| **Infrastructure** | ![Lambda](https://img.shields.io/badge/AWS-Lambda-orange) ![API Gateway](https://img.shields.io/badge/AWS-API_Gateway-orange) ![S3](https://img.shields.io/badge/AWS-S3-red) ![CloudFront](https://img.shields.io/badge/AWS-CloudFront-purple) ![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC)                                                                        |

---

Want me to inject this directly into the README or regenerate the full README again with this included?

# **Local Setup Guide**

## **1. Clone Repository**

```
git clone https://github.com/yourname/StatWoX.git
cd StatWoX
```

## **2. Backend Setup**

```
cd backend
npm install
```

### .env file

```
DATABASE_URL="postgresql://user:pass@localhost:5432/statwox"
JWT_SECRET="super_secret_key"
```

### Migrate and run

```
npx prisma migrate dev
npm run dev
```

Backend lives at:

```
http://localhost:5000
```

## **3. Frontend Setup**

```
cd frontend
npm install
npm run dev
```

Add config.js:

```js
window.STATWOX_API_URL = "http://localhost:5000"
```

---

# **Production Deployment Terraform**

### Requirements

```
terraform
direnv
aws cli
```

### Load env vars

.envrc inside infra:

```
export DATABASE_URL="postgres://..."
export JWT_SECRET="random_secret"
export AWS_ACCESS_KEY_ID="xxx"
export AWS_SECRET_ACCESS_KEY="yyy"
```

Allow env:

```
direnv allow
```

### Build backend

```
npm run build
```

### Build frontend

```
npm run build
```

### Deploy

```
terraform init
terraform apply
```

---

# **API Reference**

## **POST /api/auth/register**

Body:

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "test123"
}
```

## **POST /api/auth/login**

Returns token:

```json
{
  "token": "jwt_token",
  "userId": "cuid_xxx"
}
```

## **GET /api/surveys**

Requires header:

```
Authorization: Bearer <token>
```

---

# **Contributing Guide**

### Branch Naming

* feat
* fix
* refactor
* infra

### Commit Format

```
type(scope): message
```
---

# **Changelog**

## **v1.0.0**

* React frontend
* Serverless Express backend
* Prisma models
* Terraform infra
* CloudFront hosting
* JWT auth
* Survey fetch working

---


