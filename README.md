# **StatWoX**

A modern open source forms and surveys platform that works like Google Forms mixed with Typeform but with a cleaner developer experience and a completely serverless backend.
Built with React, Express, Prisma, AWS Lambda, API Gateway, S3, CloudFront, and Terraform.

StatWoX is your personal form and survey engine. Spin it up, share a link, collect responses, view insights.
Simple idea. Sharp execution.

---
## Visit StatWoX Surveys - ( Work In Progress )

> Link In StatWoX Repo Description 

---

# **Table of Contents**

* What StatWoX Does
* Architecture Diagram
* Variable Flow Diagram
* User Flow Diagram
* Tech Stack
* Local Setup Guide
* Production Deployment (Terraform)
* API Reference
* Contributing Guide
* Changelog

---

# **What StatWoX Does**

StatWoX is a full stack survey system with:

* Authentication (register, login, JWT)
* Dashboard for My Surveys
* Public Home Feed with sample polls
* Create survey or poll (modal only for now)
* Serverless backend exposing `/api/auth` and `/api/surveys`
* PostgreSQL via Prisma
* Fully CDN hosted frontend
* Infra deployed with Terraform

This is MVP ready and designed to scale easily.

---

# **Architecture Diagram**

```mermaid
flowchart TD

    subgraph Client
        A[Browser UI - React]<-->B[config.js]
        A<-->C[LocalStorage Token]
    end

    subgraph Frontend
        F[S3 Bucket Hosting HTML JS CSS]
        CF[CloudFront CDN]
    end

    subgraph Backend
        L[Lambda - Node20 Express API]
        G[API Gateway HTTP API]
        DB[(PostgreSQL - Prisma)]
    end

    A --> CF --> F
    A --> G
    G --> L
    L --> DB
```

---

# **Variable Flow Diagram**

```mermaid
flowchart LR
    FE[Frontend React] --> CFG[window.STATWOX_API_URL]
    CFG --> API[API Gateway URL]
    API --> JWT[Authorization: Bearer Token]
    JWT --> LAMBDA[Lambda Express]
    LAMBDA --> ENV[(DATABASE_URL, JWT_SECRET)]
    ENV --> DB[(Postgres)]
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

    U->>FE: Opens StatWoX
    FE->>U: Shows Login or Dashboard
    U->>FE: Submit Login/Register
    FE->>API: POST /api/auth/login
    API->>L: Forward request
    L->>DB: Validate User
    DB-->>L: User found
    L-->>FE: JWT Token
    FE->>Storage: Save Token

    U->>FE: Opens My Surveys
    FE->>API: GET /api/surveys (Bearer token)
    API->>L: Forward request
    L->>DB: Fetch survey list
    DB-->>L: Data
    L-->>FE: Return surveys
```

---

# **Tech Stack**

**Frontend**

* React 19
* Vite
* TypeScript
* Tailwind (CDN)
* CloudFront + S3 hosting

**Backend**

* Express
* Serverless HTTP wrapper
* Prisma ORM
* PostgreSQL
* JWT auth
* Bcrypt for password hashing

**Infra**

* AWS API Gateway
* AWS Lambda
* AWS S3
* AWS CloudFront
* Terraform (full IaC)

---

# **Local Setup Guide**

Get everything running locally for development.

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

### **Environment Variables**

Create `.env` inside `backend`:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/statwox"
JWT_SECRET="super_secret_key"
```

### **Run Migrations**

```
npx prisma migrate dev
```

### **Start Dev Server**

```
npm run dev
```

Backend runs on `http://localhost:5000`.

---

## **3. Frontend Setup**

```
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

To override API:
Create `public/config.js` or match your hosting:

```js
window.STATWOX_API_URL = "http://localhost:5000"
```

---

## **4. Connecting Frontend to Backend**

The frontend reads API URL from:

```
/config.js
```

Which Terraform generates in production.
During local dev, create it manually.

---

# **Production Deployment (Terraform)**

## **1. Install deps**

```
brew install terraform
brew install direnv
```

## **2. Load environment variables**

Create `.envrc` inside `infra/`:

```
export DATABASE_URL="postgres://..."
export JWT_SECRET="super_secret"
export AWS_ACCESS_KEY_ID="xxx"
export AWS_SECRET_ACCESS_KEY="yyy"
```

Then:

```
direnv allow
```

## **3. Build Backend**

```
cd backend
npm run build
```

This outputs `dist/lambda.js`

## **4. Build Frontend**

```
cd frontend
npm run build
```

## **5. Deploy**

```
cd infra
terraform init
terraform apply
```

Outputs include:

* CloudFront domain
* API Gateway base URL
* S3 bucket name

Copy CloudFront domain into DNS if needed.

---

# **API Reference**

Backend exposes a simple but clean API.

## **Auth Routes**

### **POST /api/auth/register**

Create a user.

**Body**

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response**

```json
{
  "message": "User created successfully",
  "userId": "cuid_123"
}
```

---

### **POST /api/auth/login**

Returns JWT token.

**Body**

```json
{
  "email": "john@example.com",
  "password": "secret123"
}
```

**Response**

```json
{
  "token": "jwt_string",
  "userId": "cuid_123"
}
```

---

## **Survey Routes**

### **GET /api/surveys**

Requires Authorization header:

```
Authorization: Bearer <jwt>
```

**Response**

```json
[
  {
    "id": "abc",
    "title": "My First Survey",
    "status": "Draft",
    "responses": 0
  }
]
```

Future versions will include real response counts.

---

# **Contributing Guide**

Thanks for being here. Contributions are welcome.

## **Branch Naming**

Use:

* `feat/xyz`
* `fix/bugname`
* `refactor/componentname`
* `infra/xxx`

## **Commit Messages**

Follow this structure:

```
type(scope): message
```

Examples:

```
feat(auth): added JWT expiry check
fix(ui): modal close handler fixed
refactor(api): improved error handling
```

## **Coding Guidelines**

* Always use TypeScript
* Follow existing file structure
* Run `npm run build` before pushing backend changes
* Test infra in sandbox accounts only
* Do not commit `.env` or any secrets

## **Before Opening PR**

* Run Prettier
* Add comments for complex logic
* Keep PRs small and focused

---

# **Changelog**

Semantic versioning starts here.

## **v1.0.0 MVP**

* Full React frontend with login, dashboard, home feed
* Serverless Express backend
* Prisma PostgreSQL models
* JWT authentication
* Survey fetch endpoint
* Terraform infrastructure for API Gateway, Lambda, CloudFront, S3
* Aurora styled UI and theme switching
* Config.js dynamic API URL injection

---
