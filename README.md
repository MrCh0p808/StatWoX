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
# **Low-Level Architecture**
This diagram shows the internal mechanics of the StatWoX backend at a low level:

- How an HTTP request enters Express
- How middlewares chain (CORS → JSON → Auth)
- How routers map to controllers
- How controllers call service methods
- How services validate input and talk to Prisma
- How responses bubble back up the chain
- Where token utilities and shared helpers plug in

Think of this as the “engine blueprint” of the backend.

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
---
# **Tech Stack**

| Category           | Tools                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF) ![Tailwind](https://img.shields.io/badge/TailwindCSS-Utility_First-38BDF8) ![CloudFront](https://img.shields.io/badge/CloudFront-CDN-orange) ![S3](https://img.shields.io/badge/S3-Static_Hosting-red) |
| **Backend**        | ![Express](https://img.shields.io/badge/Express.js-Server-lightgrey) ![Node](https://img.shields.io/badge/Node-20-green) ![Prisma](https://img.shields.io/badge/Prisma-ORM-3982CE) ![Bcrypt](https://img.shields.io/badge/BCryptJS-Hashing-yellow) ![JWT](https://img.shields.io/badge/JWT-Auth-blueviolet)                                                                           |
| **Infrastructure** | ![Lambda](https://img.shields.io/badge/AWS-Lambda-orange) ![API Gateway](https://img.shields.io/badge/AWS-API_Gateway-orange) ![S3](https://img.shields.io/badge/AWS-S3-red) ![CloudFront](https://img.shields.io/badge/AWS-CloudFront-purple) ![Terraform](https://img.shields.io/badge/Terraform-IaC-7B42BC)                                                                        |

---
# **Terraform Infra Map**
This diagram shows how Terraform provisions all StatWoX infrastructure components end-to-end:

Frontend Infra:

- S3 bucket for static React build
- CloudFront distribution
- config.js uploaded via Terraform (runtime env vars)

Backend Infra:

- API Gateway + Lambda or EC2-based Express server
- IAM roles + permissions
- VPC (optional)
- Postgres DB (Neon/Supabase/Railway = external provider)

Output wiring:

- CloudFront URL flows back into config.js
- API URL generated → injected into frontend at deploy time
- This is exactly how your project is set up in the repo.

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
---

# **CI/CD Pipeline**
This diagram shows the automated deployment flow for StatWoX:

1. Developer pushes code → GitHub
2. CI pipeline runs tests, lint, type-check, build
3. Backend packaged → deployed to Lambda/API Gateway (or EC2)
4. Frontend built → uploaded to S3
5. Terraform applies infra updates
6. CloudFront cache invalidated
7. Frontend fetches config.js with updated API URL

This is the “delivery assembly line” for StatWoX.

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
---
# **Authentication Sequence Diagram**

```mermaid
sequenceDiagram
    autonumber

    participant U as User<br>(Client)
    participant UI as Frontend<br>(React)
    participant API as Backend<br>(Express API)
    participant Auth as Auth Controller<br>(/api/auth/login)
    participant DB as Postgres<br>(Prisma ORM)
    participant JWT as JWT Service

    %% USER ACTION
    U->>UI: Enter Email + Password<br>Click "Login"

    %% FRONTEND REQUEST
    UI->>API: POST /api/auth/login<br>{ email, password }

    %% BACKEND HANDOFF
    API->>Auth: Validate Request<br>Trim + sanitize input

    %% DB LOOKUP
    Auth->>DB: findUserByEmail(email)
    DB-->>Auth: User Record or Null

    %% PASSWORD VERIFY
    Auth->>Auth: Compare bcrypt(password, hash)
    Auth-->>API: Valid or Unauthorized

    %% JWT GENERATION
    API->>JWT: Generate Token<br>(userId)
    JWT-->>API: Signed JWT

    %% RESPONSE
    API-->>UI: 200 OK<br>{ token, user }

    %% FRONTEND STORE
    UI->>UI: Save JWT (localStorage)<br>Set AuthContext

    %% USER NAVIGATION
    UI-->>U: Redirect to Dashboard<br>/feed or /mysurveys

```

---

# **Survey Creation Pipeline**

This diagram shows how a survey moves from the user's UI → through the builder flow → validated → stored in Postgres → returned to the UI.
It covers:

- user actions,
- frontend builder state,
- backend validation,
- Prisma operations,
- and how the final survey gets an ID + gets stored.

This pipeline matches StatWoX’s current structure: Survey Builder → Save Draft → Publish → Feed.

```mermaid
---
config:
  theme: redux-dark
  layout: dagre
---
flowchart LR
    U["User<br>Creates Survey<br>(Builder UI)"] --> FE["Frontend (React)<br>Builder State + Draft Object<br>Validates title, desc, questions"]
    FE -- Submit Survey --> API["POST /api/surveys<br>Express Controller"]
    API --> VAL["Validation Layer<br>(Survey title, type,<br>question schema, options)"]
    VAL -- Valid --> PRISMA["Prisma ORM<br>(survey.create,<br>question.createMany)"]
    PRISMA --> DB["PostgreSQL<br>Tables:<br>- Survey<br>- Question<br>- Options"] & RES["Response<br>{ surveyId, status }"]
    DB --> PRISMA
    RES --> UIU["UI Update<br>Redirect to analytics<br>or preview page"]
    UIU --> U
```
---
# **Data Flow**

This diagram shows how data moves through StatWoX from the moment the user interacts with the UI to surveys being created, answered, analyzed, and displayed in the feed.

It focuses on stateless frontend, typed API contracts, Prisma-backed DB operations, and derived analytics for dashboards + feed.
It’s basically the “blood circulation system” of StatWoX.

```mermaid
---
config:
  theme: redux-dark
---
flowchart LR
    U["User<br>(Browser / Mobile Web)"] --> UI["React Frontend<br>(State, Context, Fetch API)"]
    UI -- Auth Requests --> Auth["Auth Routes<br>(Login, Register, Google)"]
    UI -- CRUD Surveys --> Survey["Survey Routes<br>(Create, Update, Publish)"]
    UI -- Submit Responses --> ResponseR["Response Routes<br>(Submit Response)"]
    UI -- Fetch Feed --> Feed["Feed Engine<br>(Trending, Featured, Recommended)"]
    UI -- Fetch Analytics --> Analytics["Analytics Engine<br>(Aggregations, Stats)"]
    Auth --> Prisma["Prisma ORM<br>Typed DB Access"] & UI
    Survey --> Prisma & UI
    ResponseR --> Prisma & UI
    Feed --> Prisma & UI
    Analytics --> Prisma & UI
    Prisma --> DB["PostgreSQL<br>Users, Surveys,<br>Questions, Responses"] & Auth & Survey & ResponseR & Feed & Analytics
    DB --> Prisma
    API["Backend API<br>(Express + Middleware)"]
```
---
# **Backend Internal Module Graph**
This diagram shows the internal wiring of the StatWoX backend:

- How each API endpoint maps to routes
- How routes map to controllers
- How controllers call service-layer logic
- How services interact with Prisma
- How middlewares (CORS, JWT, JSON) bind the whole chain
- Where utilities like token helpers or validators plug in

Think of it like the backend’s “circuit board”.

```mermaid
---
config:
  theme: redux-dark
  layout: elk
---
flowchart LR
 subgraph ROUTES["Routes Layer"]
        AuthRoute["auth.routes.ts<br>/api/auth"]
        GoogleRoute["googleAuth.routes.ts<br>/api/auth/google"]
        SurveyRoute["survey.routes.ts<br>/api/surveys"]
        FeedRoute["feed.routes.ts<br>/api/feed"]
  end
 subgraph CONTROLLERS["Controller Layer"]
        AuthCtrl["Auth Controller<br>login, register,<br>googleLogin, phoneOTP?"]
        GoogleCtrl["Google Auth Controller<br>ID Token Verify"]
        SurveyCtrl["Survey Controller<br>Create, Update,<br>Publish, Delete"]
        FeedCtrl["Feed Controller<br>Trending, Featured,<br>Recommendations"]
  end
 subgraph SERVICES["Service Layer"]
        UserService["User Service<br>findOrCreateUser,<br>hashPassword,<br>validateCredentials"]
        SurveyService["Survey Service<br>createSurvey,<br>addQuestions,<br>publish"]
        ResponseService["Response Service<br>submitResponse,<br>aggregate"]
        FeedService["Feed Service<br>rankSurveys,<br>fetchTrending"]
  end
 subgraph MIDDLEWARE["Middleware"]
        JSONMW["JSON Parser<br>express.json()"]
        CORSMW["CORS Config"]
        AuthMW["Auth Middleware<br>JWT Verify → req.user"]
        ErrorMW["Error Handler"]
  end
 subgraph DATABASE["Database Layer"]
        Prisma["Prisma Client<br>Typed Client"]
        Postgres["PostgreSQL<br>Users, Surveys,<br>Questions, Responses"]
  end
 subgraph UTILS["Utilities"]
        TokenUtil["Token Utils<br>signJWT, verifyJWT"]
        Validator["Input Validators<br>schema checks"]
        Logger["Logger / Debug"]
  end
    App["server.ts / index.ts<br>• Express App Init<br>• CORS + JSON<br>• Route Mounting"] --> JSONMW & CORSMW & AuthMW & AuthRoute & GoogleRoute & SurveyRoute & FeedRoute & ErrorMW
    AuthRoute --> AuthCtrl
    GoogleRoute --> GoogleCtrl
    SurveyRoute --> SurveyCtrl
    FeedRoute --> FeedCtrl
    AuthCtrl --> UserService & TokenUtil
    GoogleCtrl --> UserService
    SurveyCtrl --> SurveyService & ResponseService & Validator
    FeedCtrl --> FeedService
    UserService --> Prisma
    SurveyService --> Prisma
    ResponseService --> Prisma & Validator
    FeedService --> Prisma
    Prisma --> Postgres
    AuthMW --> TokenUtil
```
---
# **Local Setup Guide**

## **1. Clone Repository**

```
git clone https://github.com/MrCh0p808/StatWoX.git
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


