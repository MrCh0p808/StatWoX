<div align="center">
  <img src="frontend/public/assets/logo.svg" width="800" alt="StatWoX Logo"/>
</div>

<div align="center">
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

<br/>

StatWoX is a modern open source forms and surveys platform.  
Think Google Forms for usability, Typeform for presentation, and a clean serverless backend designed for developers.

It allows you to create surveys, share them instantly, collect responses, analyze insights, and export data to Google Drive or local storage.

Simple concept. Focused execution.

---

## Visit StatWoX Surveys (Work In Progress)

Link available in the repository description.

---

## Table of Contents

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

## <span id="what-statwox-does">What StatWoX Does</span>

StatWoX is an open source surveys and forms platform that combines:

- The simplicity of Google Forms  
- The presentation quality of Typeform  
- A fully serverless backend architecture  

Core capabilities include:

1. User authentication
2. Personal dashboard for managing surveys
3. Public discovery feed
4. Survey, poll, and form creation
5. Serverless backend running on AWS Lambda
6. PostgreSQL database via Prisma ORM
7. CloudFront-powered global delivery
8. Infrastructure fully managed using Terraform

Built to be scalable, reliable, and fast.

[Back to Top](#table-of-contents)

---

## <span id="architecture-diagram">Architecture Diagram</span>

<details>
<summary><b>Click to expand architecture diagram</b></summary>

```mermaid
flowchart LR
    subgraph CLIENT["Client Layer"]
        UI["React Frontend"]
        ConfigJS["config.js"]
    end
    subgraph CDN["Static Hosting"]
        CF["CloudFront"]
        S3["S3 Bucket"]
    end
    subgraph API["Backend API"]
        APIGW["API Gateway"]
        Backend["Node + Express on Lambda"]
        AuthController["Auth Controller"]
        SurveyController["Survey Controller"]
        FeedController["Feed Controller"]
    end
    subgraph DB["Database"]
        Postgres["PostgreSQL"]
        Prisma["Prisma ORM"]
    end
    UI --> CF
    CF --> S3
    UI --> APIGW
    APIGW --> Backend
    Backend --> AuthController
    Backend --> SurveyController
    Backend --> FeedController
    AuthController --> Prisma
    SurveyController --> Prisma
    FeedController --> Prisma
    Prisma --> Postgres
````

</details>

[Back to Top](#table-of-contents)

---

## <span id="detailed-architecture-breakdown">Detailed Architecture Breakdown</span>

<details>
<summary><b>Click to expand</b></summary>

### Frontend

* React 19 with TypeScript
* Built using Vite
* Tailwind CSS for styling
* Hosted on S3 and served via CloudFront
* Runtime configuration injected through config.js
* JWT stored in localStorage
* Animations handled using Framer Motion

### Backend

* Express.js running inside AWS Lambda
* API Gateway in proxy mode
* JWT-based authentication
* Prisma ORM with PostgreSQL
* No long-running servers

### Infrastructure

* Provisioned entirely using Terraform
* Secure S3 bucket with CloudFront OAC
* Lambda bundled using esbuild
* Environment variables injected at deploy time

### Build and Deploy Flow

1. Frontend built using Vite
2. Backend bundled using esbuild
3. Terraform provisions infrastructure
4. Static assets uploaded to S3
5. Lambda deployed
6. API and CDN URLs injected into config.js

</details>

[Back to Top](#table-of-contents)

---

## <span id="low-level-architecture">Low-Level Architecture</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
flowchart TB
    Entry["server.ts"] --> Middleware
    Middleware --> Routes
    Routes --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> PostgreSQL
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="terraform-infra-map">Terraform Infrastructure Map</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
flowchart TB
    Terraform --> S3
    Terraform --> CloudFront
    Terraform --> API_Gateway
    Terraform --> Lambda
    Lambda --> PostgreSQL
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="cicd-pipeline">CI/CD Pipeline</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
flowchart LR
    Commit --> GitHub
    GitHub --> CI
    CI --> Build
    Build --> Terraform
    Terraform --> Deploy
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="authentication-sequence-diagram">Authentication Sequence Diagram</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
sequenceDiagram
    User->>Frontend: Login request
    Frontend->>Backend: POST /auth/login
    Backend->>DB: Validate credentials
    Backend->>Frontend: JWT token
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="survey-creation-pipeline">Survey Creation Pipeline</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
flowchart LR
    User --> Frontend
    Frontend --> Backend
    Backend --> Prisma
    Prisma --> Database
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="tech-stack">Tech Stack</span>

| Category       | Tools                                   |
| -------------- | --------------------------------------- |
| Frontend       | React, TypeScript, Vite, Tailwind       |
| Backend        | Node.js, Express, Prisma                |
| Database       | PostgreSQL                              |
| Infrastructure | AWS Lambda, API Gateway, S3, CloudFront |
| IaC            | Terraform                               |

[Back to Top](#table-of-contents)

---

## <span id="local-setup-guide">Local Setup Guide</span>

<details>
<summary><b>Click to expand</b></summary>

### Clone Repository

```bash
git clone https://github.com/MrCh0p808/StatWoX.git
cd StatWoX
```

### Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/statwox
JWT_SECRET=your_secret
```

Run migrations and start:

```bash
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Add `config.js`:

```js
window.STATWOX_API_URL = "http://localhost:5000"
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="contributing-guide">Contributing Guide</span>

Branch naming:

* feat/*
* fix/*
* refactor/*
* infra/*

Commit format:

```
type(scope): message
```

Examples:

```
feat(auth): add google login
fix(api): resolve survey fetch bug
```

[Back to Top](#table-of-contents)

---

## <span id="changelog">Changelog</span>

### v1.0.0

* React frontend
* Serverless backend
* Prisma database models
* Terraform-managed infrastructure
* JWT authentication
* Survey creation and response flow

[Back to Top](#table-of-contents)

```

---

