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

<img src="https://img.shields.io/badge/License-MIT-purple" />
<br/>
<img src="https://img.shields.io/badge/Made_by-V3nd377a_73C0rp-black" />
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

- [What StatWoX Does](#what-statwox-does)
- [Architecture Diagram](#architecture-diagram)
- [Detailed Architecture Breakdown](#detailed-architecture-breakdown)
- [Low-Level Architecture](#low-level-architecture)
- [Terraform Infra Map](#terraform-infra-map)
- [CI/CD Pipeline](#cicd-pipeline)
- [Authentication Sequence Diagram](#authentication-sequence-diagram)
- [Survey Creation Pipeline](#survey-creation-pipeline)
- [Data Flow](#data-flow)
- [Backend Internal Module Graph](#backend-internal-module-graph)
- [Tech Stack](#tech-stack)
- [Local Setup Guide](#local-setup-guide)
- [Production Deployment Terraform](#production-deployment-terraform)
- [API Reference](#api-reference)
- [Contributing Guide](#contributing-guide)
- [Changelog](#changelog)

---

# <span id="what-statwox-does">🚀 What StatWoX Does</span>

> A modern open-source forms & surveys platform combining **Google Forms simplicity**, **Typeform aesthetics**, and **serverless engineering**.

StatWoX provides:

### ✔ Authentication

### ✔ Dashboard for My Surveys

### ✔ Public Home Feed

### ✔ Create Surveys / Polls

### ✔ Serverless backend running inside AWS Lambda

### ✔ PostgreSQL via Prisma ORM

### ✔ CloudFront global static delivery

### ✔ Terraform-managed infra

Scalable. Reliable. Fast AF.

[🔼 Back to Top](#table-of-contents)

---

# <span id="architecture-diagram">🧩 Architecture Diagram</span>

<details>
<summary><b>📦 Click to Expand Architecture Diagram</b></summary><br>

```mermaid
---
config:
  theme: redux-dark
---
flowchart LR
    subgraph CLIENT["🌐 Client Layer (Browsers / Mobile Web)"]
        UI["React Frontend<br>(Tailwind + Framer Motion)<br>Pages: Login, Feed, Builder, Responder, MySurveys, Analytics"]
        ConfigJS["config.js<br>(Runtime Env Vars)<br>(API_URL, GOOGLE_CLIENT_ID)"]
    end
    subgraph CDN["🚀 CDN + Static Hosting"]
        CF["CloudFront"]
        S3["S3 Bucket (Static Build)<br>/index.html, /assets, config.js"]
    end
    subgraph API["🧩 Backend API Layer"]
        direction TB
        APIGW["API Gateway (REST)"]
        Backend["Node/Express Server<br>Compiled w/ esbuild<br>Routes: Auth, GoogleAuth, Surveys, Feed"]
        AuthController["Auth Controller<br>(Login, Register, Google Login, OTP?)"]
        SurveyController["Survey Controller<br>(Create, Update, Publish, Respond)"]
        FeedController["Feed Controller<br>(Trending, Featured, Recommended)"]
        Middleware["Middlewares:<br>CORS, JSON, AuthMiddleware (JWT Verify)"]
    end
    subgraph DB["🗄️ Database Layer"]
        Postgres["PostgreSQL (Supabase/Railway/Neon)<br>Tables: Users, Surveys, Questions, Responses"]
        Prisma["Prisma Client<br>+ Migrations<br>Used by Backend"]
    end
    subgraph THIRD["🔌 Third-Party Services"]
        GoogleID["Google Identity Services<br>(ID Token)"]
        OTP["(Optional) SMS OTP Provider<br>(Twilio / Authy)"]
    end
    UI --> CF
    CF --> S3
    CF --> UI
    UI --> ConfigJS
    UI -->|API Calls using API_URL| APIGW
    APIGW --> Backend
    Backend --> Middleware
    Backend --> AuthController
    Backend --> SurveyController
    Backend --> FeedController
    AuthController --> Prisma
    SurveyController --> Prisma
    FeedController --> Prisma
    Prisma --> Postgres
    UI -->|Google ID Token| GoogleID
    GoogleID -->|Verified Token| AuthController

    UI -->|Send OTP / Verify| OTP
    OTP --> AuthController
    ConfigJS --> UI
```

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="detailed-architecture-breakdown">📘 Detailed Architecture Breakdown</span>

<details>
<summary><b>🟣 Click to Expand Detailed Architecture Breakdown</b></summary><br>

---

## ⚛️ **Frontend**

* React 19 + TypeScript 5
* Bundled using Vite
* Tailwind CSS loaded dynamically
* Hosted on AWS **S3 → CloudFront**
* `config.js` injected at deploy time
* JWT persisted in localStorage
* Smooth animations via Framer Motion

---

## 🛠 **Backend**

* Express.js running inside **AWS Lambda**
* API Gateway in `$default` proxy mode
* JWT auth
* Prisma ORM with PostgreSQL
* Zero “server” — pure serverless compute

---

## 🏗 **Infrastructure**

* Fully provisioned by **Terraform**
* Secure S3 bucket (no public ACL)
* CloudFront OAC used for secure access
* Lambda packaged via esbuild → zip → Terraformed
* Lambda env vars: `DATABASE_URL`, `JWT_SECRET`, etc.

---

## 🔧 **Build & Deploy Flow**

1. `vite build` → outputs `dist/`
2. Terraform uploads dist assets to S3
3. Backend built via esbuild → lambda.js
4. Terraform zips & deploys Lambda
5. Terraform outputs:

   * **API URL**
   * **CloudFront Domain**
6. `config.js` regenerated using these outputs

---

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="low-level-architecture">🧬 Low-Level Architecture (Backend Engine Blueprint)</span>

<details>
<summary><b>🟡 Click to Expand Low-Level Architecture</b></summary><br>

```mermaid
---
config:
  theme: redux-dark
  layout: elk
---
flowchart TB
 subgraph MW["Middleware Chain"]
        CORS["CORS Middleware<br>Allowed Origins"]
        JSONMW["JSON Parser<br>express.json()"]
        LogMW["Request Logger<br>(optional)"]
        AuthMW["Auth Middleware<br>Read JWT → req.user"]
        ErrorMW["Global Error Handler"]
  end
 subgraph ROUTERS["Route Layer"]
        AuthR["auth.routes.ts<br>/api/auth"]
        GoogleR["googleAuth.routes.ts<br>/api/auth/google"]
        SurveyR["survey.routes.ts<br>/api/surveys"]
        ResponseR["response.routes.ts<br>/api/responses"]
        FeedR["feed.routes.ts<br>/api/feed"]
  end
 subgraph CTRL["Controller Layer"]
        AuthCtrl["Auth Controller<br>login()<br>register()<br>googleLogin()"]
        SurveyCtrl["Survey Controller<br>create()<br>update()<br>publish()"]
        RespCtrl["Response Controller<br>submit()<br>validate()"]
        FeedCtrl["Feed Controller<br>getTrending()<br>getFeatured()"]
  end
 subgraph SERVICES["Service Layer"]
        UserSvc["User Service<br>hashPassword()<br>compare()<br>findOrCreateUser()"]
        SurveySvc["Survey Service<br>validateSchema()<br>createSurvey()<br>addQuestions()"]
        RespSvc["Response Service<br>storeResponse()<br>aggregateStats()"]
        FeedSvc["Feed Service<br>rankSurveys()<br>loadFeed()"]
  end
 subgraph UTILS["Utility Layer"]
        TokenUtil["Token Utils<br>signJWT()<br>verifyJWT()"]
        Validator["Validation Schemas<br>(Zod/Yup/Joi)"]
        Crypto["Crypto Helpers<br>bcrypt, hashing"]
  end
 subgraph DB["Database Layer"]
        Prisma["Prisma Client<br>(Type-Safe ORM)"]
        PG["PostgreSQL<br>Tables:<br>Users<br>Surveys<br>Questions<br>Responses"]
  end
    Entry["server.ts / index.ts<br>• Express() Init<br>• Env Load (.env)<br>• Register Middlewares<br>• Attach Routers"] --> CORS
    CORS --> JSONMW
    JSONMW --> LogMW
    LogMW --> AuthMW
    AuthMW --> ROUTERS & TokenUtil
    AuthR --> AuthCtrl
    GoogleR --> AuthCtrl
    SurveyR --> SurveyCtrl
    ResponseR --> RespCtrl
    FeedR --> FeedCtrl
    AuthCtrl --> UserSvc & TokenUtil
    SurveyCtrl --> SurveySvc
    RespCtrl --> RespSvc
    FeedCtrl --> FeedSvc
    UserSvc --> Prisma & Crypto
    SurveySvc --> Prisma & Validator
    RespSvc --> Prisma & Validator
    FeedSvc --> Prisma
    Prisma --> PG
    ROUTERS --> ErrorMW
    CTRL --> ErrorMW
    SERVICES --> ErrorMW
```

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="terraform-infra-map">🏗 Terraform Infra Map</span>

<details>
<summary><b>🟩 Click to Expand Terraform Infra Map</b></summary><br>

```mermaid
---
config:
  theme: redux-dark
  look: neo
  layout: dagre
---
flowchart TB
 subgraph TF["Terraform Root<br>(statwox/infra)"]
        TFVars["terraform.tfvars<br>Inputs (API_URL, DOMAIN,<br>GOOGLE_CLIENT_ID)"]
        Providers["Providers:<br>- AWS<br>- random<br>- archive<br>- local"]
        State["Terraform State<br>(local or s3 backend)"]
  end
 subgraph FE["Frontend Infra<br>(CDN + Static Hosting)"]
        S3["AWS S3 Bucket<br>Static React Build<br>/index.html<br>/assets<br>/config.js"]
        CF["CloudFront Distribution<br>+ OAI<br>+ Cache Behaviors"]
        ConfigGen["local_file config.js<br>(API_URL injected)<br>Uploaded via TF"]
  end
 subgraph BE["Backend Infra<br>(Application Layer)"]
        APIGW["API Gateway<br>REST API"]
        Lambda["AWS Lambda<br>(Node/Express<br>esbuild bundle)"]
        IAMLambda["IAM Role<br>Lambda Execution"]
        Logs["CloudWatch Logs"]
  end
 subgraph DB["Database Layer<br>(External Managed Provider)"]
        Postgres["PostgreSQL<br>(Neon / Supabase / Railway)"]
  end
    TF --> Providers & S3 & CF & ConfigGen & IAMLambda & Lambda
    CF --> S3
    Lambda --> Logs & APIGW & Postgres
    APIGW --> Lambda & API_URL_TO_CONFIG["Inject API_URL into<br>config.js"]
    TF -- Output: CDN_URL --> CF
    TF -- Output: API_URL --> APIGW
    API_URL_TO_CONFIG --> ConfigGen
    ConfigGen --> S3
    S3 --> CF
```

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="cicd-pipeline">🛠 CI/CD Pipeline</span>

<details>
<summary><b>⚙️ Click to Expand CI/CD Pipeline</b></summary><br>

```mermaid
---
config:
  look: classic
  theme: redux-dark
  layout: elk
---
flowchart LR
 subgraph CI["GitHub Actions CI Pipeline"]
        Checkout["Checkout Code"]
        Install["Install Deps<br>(npm install)"]
        Lint["ESLint + Type Check"]
        Test["Unit Tests + API Tests"]
        FE_Build["Frontend Build<br>npm run build"]
        BE_Build["Backend Build<br>esbuild bundle"]
        Artifacts["Bundle Artifacts<br>(dist/, lambda.zip)"]
  end
 subgraph CD["Deployment Pipeline"]
        TF_Plan["Terraform Plan"]
        TF_Apply["Terraform Apply<br>Infrastructure Update"]
        UploadS3["Upload Frontend Build<br>to S3 Bucket"]
        DeployLambda["Deploy Lambda Package<br>(lambda.zip)"]
        CF_Invalidate["CloudFront Invalidation<br>/*"]
        Outputs["Terraform Outputs<br>API_URL, CDN_URL"]
        UpdateConfig["Generate+Upload config.js<br>(API_URL injected)"]
  end
    Dev["Developer<br>Commits / PR"] --> GitHub["GitHub Repo<br>(statwox)"]
    GitHub --> CI
    CI --> Checkout
    Checkout --> Install
    Install --> Lint
    Lint --> Test
    Test --> FE_Build & BE_Build
    FE_Build --> Artifacts
    BE_Build --> Artifacts
    Artifacts --> CD
    CD --> TF_Plan
    TF_Plan --> TF_Apply
    TF_Apply --> UploadS3 & DeployLambda & Outputs
    UploadS3 --> CF_Invalidate
    Outputs --> UpdateConfig
    UpdateConfig --> S3["S3 Static Hosting"]
    S3 --> CF["CloudFront CDN"]
    CF --> Users["Users on Browser"]
    API["API Gateway / Lambda"] --> Users
```

</details>
[🔼 Back to Top](#table-of-contents)

---
# **🧬 System Diagrams**

---

# <span id="authentication-sequence-diagram">🔐 Authentication Sequence Diagram</span>

<details>
<summary><b>Click to Expand</b></summary><br>

```mermaid
sequenceDiagram
    autonumber
    participant U as User<br>(Client)
    participant UI as Frontend<br>(React)
    participant API as Backend<br>(Express API)
    participant Auth as Auth Controller<br>(/api/auth/login)
    participant DB as Postgres<br>(Prisma ORM)
    participant JWT as JWT Service
    U->>UI: Enter Email + Password<br>Click "Login"
    UI->>API: POST /api/auth/login<br>{ email, password }
    API->>Auth: Validate Request
    Auth->>DB: findUserByEmail(email)
    DB-->>Auth: User Record or Null
    Auth->>Auth: Compare bcrypt(password, hash)
    API->>JWT: Generate Token<br>(userId)
    JWT-->>API: Signed JWT
    API-->>UI: 200 OK<br>{ token, user }
    UI->>UI: Save JWT<br>(localStorage)
    UI-->>U: Redirect to Dashboard
```

</details>

---

# <span id="google-login-flow">🔑 Google Login Flow (End-to-End)</span>

<details>
<summary><b>Click to Expand</b></summary><br>

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant UI as Frontend
    participant GSI as Google Identity
    participant API as Backend
    participant GV as Google Verify API
    participant DB as Postgres
    participant JWT as JWT Service
    UI->>GSI: Load GSI Script
    U->>UI: Click Google Login
    UI->>GSI: Trigger One Tap / Button
    GSI-->>UI: Return ID Token (credential)
    UI->>API: POST /api/auth/google<br>{ credential }
    API->>GV: verifyIdToken(credential)
    GV-->>API: { email, name, picture }
    API->>DB: findOrCreateUser(email)
    DB-->>API: userId
    API->>JWT: sign({ userId })
    JWT-->>API: Signed JWT
    API-->>UI: { token, user }
    UI-->>U: Redirect to Dashboard
```

</details>

---

# <span id="survey-creation-pipeline">📝 Survey Creation Pipeline</span>

<details>
<summary><b>Click to Expand</b></summary><br>

```mermaid
flowchart LR
    U["User<br>Builder UI"] --> FE["Frontend<br>Draft State<br>Validation"]
    FE -->|Submit Survey| API["POST /api/surveys"]
    API --> VAL["Validation Layer"]
    VAL -->|Valid| PRISMA["Prisma ORM"]
    PRISMA --> DB["PostgreSQL<br>Survey / Questions / Options"]
    PRISMA --> RES["Response<br>{ surveyId }"]
    RES --> UIU["UI Redirect<br>Analytics / Preview"]
    UIU --> U
```

</details>
---

# <span id="data-flow">🔄 Data Flow Diagram</span>

<details>
<summary><b>Click to Expand</b></summary><br>

```mermaid
flowchart LR
    U["User"] --> UI["React Frontend"]
    UI --> Auth["Auth Routes"]
    UI --> Survey["Survey Routes"]
    UI --> ResponseR["Response Routes"]
    UI --> Feed["Feed Engine"]
    UI --> Analytics["Analytics Engine"]
    Auth --> Prisma
    Survey --> Prisma
    ResponseR --> Prisma
    Feed --> Prisma
    Analytics --> Prisma
    Prisma --> DB["PostgreSQL"]
    DB --> Prisma
```

</details>
---

# <span id="backend-internal-module-graph">⚙️ Backend Internal Module Graph</span>

<details>
<summary><b>Click to Expand</b></summary><br>

```mermaid
flowchart LR
 subgraph ROUTES["Routes"]
        AuthRoute["auth.routes.ts"]
        GoogleRoute["googleAuth.routes.ts"]
        SurveyRoute["survey.routes.ts"]
        FeedRoute["feed.routes.ts"]
  end
 subgraph CTRL["Controllers"]
        AuthCtrl["Auth Controller"]
        GoogleCtrl["Google Auth Controller"]
        SurveyCtrl["Survey Controller"]
        FeedCtrl["Feed Controller"]
  end
 subgraph SERVICES["Services"]
        UserService["User Service"]
        SurveyService["Survey Service"]
        ResponseService["Response Service"]
        FeedService["Feed Service"]
  end
 subgraph MIDDLEWARE["Middleware"]
        JSONMW["JSON Parser"]
        CORSMW["CORS"]
        AuthMW["JWT Verify"]
        ErrorMW["Error Handler"]
  end
 subgraph DB["Database"]
        Prisma["Prisma Client"]
        Postgres["PostgreSQL"]
  end
 subgraph UTILS["Utils"]
        TokenUtil["JWT Utils"]
        Validator["Validators"]
        Crypto["bcrypt Helpers"]
  end

    AuthRoute --> AuthCtrl
    GoogleRoute --> GoogleCtrl
    SurveyRoute --> SurveyCtrl
    FeedRoute --> FeedCtrl

    AuthCtrl --> UserService
    GoogleCtrl --> UserService
    SurveyCtrl --> SurveyService
    FeedCtrl --> FeedService

    UserService --> Prisma
    SurveyService --> Prisma
    ResponseService --> Prisma
    FeedService --> Prisma

    Prisma --> Postgres

    AuthMW --> TokenUtil
    SurveyService --> Validator
    ResponseService --> Validator
```

</details>
[🔼 Back to Top](#table-of-contents)
---
# <span id="tech-stack">🧪 Tech Stack</span>

<details>
<summary><b>Click to Expand</b></summary><br>

| Category           | Tools                                                  |
| ------------------ | ------------------------------------------------------ |
| **Frontend**       | React 19, TypeScript 5, Vite, Tailwind, CloudFront, S3 |
| **Backend**        | Express.js, Node 20, Prisma ORM, BcryptJS, JWT         |
| **Infrastructure** | AWS Lambda, API Gateway, S3, CloudFront, Terraform     |

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="local-setup-guide">🖥 Local Setup Guide</span>

<details>
<summary><b>Click to Expand</b></summary><br>

### **1. Clone Repository**

```bash
git clone https://github.com/MrCh0p808/StatWoX.git
cd StatWoX
```

---

### **2. Backend Setup**

```bash
cd backend
npm install
```

#### **Create `.env`**

```
DATABASE_URL="postgresql://user:pass@localhost:5432/statwox"
JWT_SECRET="super_secret_key"
```

#### **Migrate + Run**

```bash
npx prisma migrate dev
npm run dev
```

Backend URL:

```
http://localhost:5000
```

---

### **3. Frontend Setup**

```bash
cd frontend
npm install
npm run dev
```

#### **Add config.js**

```js
window.STATWOX_API_URL = "http://localhost:5000"
```

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="production-deployment-terraform">🚀 Production Deployment (Terraform)</span>

<details>
<summary><b>Click to Expand</b></summary><br>

### **Requirements**

```
terraform
direnv
aws cli
```

---

### **Load Environment Variables**

Create `.envrc` inside `infra/`:

```
export DATABASE_URL="postgres://..."
export JWT_SECRET="random_secret"
export AWS_ACCESS_KEY_ID="xxx"
export AWS_SECRET_ACCESS_KEY="yyy"
```

Allow access:

```bash
direnv allow
```

---

### **Build Backend**

```bash
npm run build
```

### **Build Frontend**

```bash
npm run build
```

---

### **Deploy Infrastructure**

```bash
terraform init
terraform apply
```

This provisions:

* S3 static hosting
* CloudFront CDN
* API Gateway
* Lambda backend
* IAM roles
* Config injection
* Outputs (API URL + CDN domain)

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="api-reference">📡 API Reference</span>

<details>
<summary><b>Click to Expand</b></summary><br>

---

## **POST /api/auth/register**

**Body**

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "test123"
}
```

---

## **POST /api/auth/login**

**Returns**

```json
{
  "token": "jwt_token",
  "userId": "cuid_xxx"
}
```

---

## **GET /api/surveys**

**Headers**

```
Authorization: Bearer <token>
```

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="contributing-guide">🤝 Contributing Guide</span>

<details>
<summary><b>Click to Expand</b></summary><br>

### **Branch Naming**

* `feat/*`
* `fix/*`
* `refactor/*`
* `infra/*`

### **Commit Format**

```
type(scope): message
```

Examples:

```
feat(auth): add OTP login
fix(api): correct survey route
refactor(builder): extract drag/drop logic
```

</details>

[🔼 Back to Top](#table-of-contents)

---

# <span id="changelog">📜 Changelog</span>

<details>
<summary><b>Click to Expand</b></summary><br>

## **v1.0.0**

* React frontend
* Serverless Express backend
* Prisma models
* Terraform infra
* CloudFront hosting
* JWT authentication
* Survey creation + fetch working

</details>

[🔼 Back to Top](#table-of-contents)

---



