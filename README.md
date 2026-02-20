<div align="center">
  <img src="public/logo.png" width="100" alt="StatWoX Icon"/>
  <br/>
  <h1>StatWoX</h1>
</div>

<div align="center">
  <h3><b><i>Let The Stat Work Out Your Decision Making</i></b></h3>

  <img src="https://img.shields.io/badge/Build-passing-brightgreen" />
  <img src="https://img.shields.io/badge/Version-1.1.0-blue" />
  <img src="https://img.shields.io/badge/PRs-welcome-green" />
  <img src="https://img.shields.io/badge/Powered_by-CodeSwami_Protocol-orange" />
  <img src="https://img.shields.io/badge/Phase-3.5_Identity_Engine-teal" />

  <br/>

  <img src="https://img.shields.io/badge/Next.js-15-black" />
  <img src="https://img.shields.io/badge/React-19-61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue" />
  <img src="https://img.shields.io/badge/Prisma-ORM-3982CE" />
  <img src="https://img.shields.io/badge/Zustand-State-orange" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-336791" />

  <img src="https://img.shields.io/badge/License-MIT-purple" />
  <br/>
  <img src="https://img.shields.io/badge/Made_by-V3nd377a_73C0rp-black" />
</div>

<br/>

**StatWoX is an open-source platform for forms, surveys, and polls that connects data collection directly to analysis, decision-making, and social engagement.**

Most tools stop at collecting responses. Real teams struggle after that. They collect data in one tool, analyze it elsewhere, visualize it in another place, and export results manually. Context is lost. Work is repeated. Insights arrive late.

StatWoX removes this entire gap while introducing a **Trust & Identity Layer** to combat misinformation in public surveying.

---

## 📖 Table of Contents

1. [What StatWoX Does](#1-what-statwox-does)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Detailed Architecture Breakdown](#3-detailed-architecture-breakdown)
4. [Low-Level Architecture](#4-low-level-architecture)
5. [Terraform Infra Map](#5-terraform-infra-map)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Authentication Sequence Diagram](#7-authentication-sequence-diagram)
8. [Survey Creation Pipeline](#8-survey-creation-pipeline)
9. [Data Flow](#9-data-flow)
10. [Backend Internal Module Graph](#10-backend-internal-module-graph)
11. [Tech Stack](#11-tech-stack)
12. [Entire DB Schema](#12-entire-db-schema)
13. [Local Setup Guide](#13-local-setup-guide)
14. [Production Deployment Terraform](#14-production-deployment-terraform)
15. [API Reference](#15-api-reference)
16. [Contributing Guide](#16-contributing-guide)
17. [Changelog](#17-changelog)

---

## <span id="1-what-statwox-does">1. 🎯 What StatWoX Does</span>

StatWoX is an open source surveys and forms platform that combines:

- The simplicity of Google Forms  
- The presentation quality of Typeform  
- A modern social feed for public polls
- A strict Identity Verification layer to curb fake data

Core capabilities include:

1. **User Authentication**: Secure JWT session management + **Google OAuth**.
2. **Personal Dashboard**: Manage, edit, and track your surveys in one place.
3. **Survey Engine**: Create dynamic surveys with various question types, drag-and-drop ordering, and skip-logic.
4. **Analytics Engine**: Real-time aggregation of survey responses mathematically mapped to dynamic charts.
5. **Trust Verification**: Users must verify their professional identity (via LinkedIn or DigiLocker) to broadcast surveys publicly to the Main Feed.
6. **Global Delivery**: Entirely open-source and deployable via modern Serverless edge infrastructure.

---

## <span id="2-architecture-diagram">2. 🏗 Architecture Diagram</span>

StatWoX operates fundamentally as a monolithic serverless deployable package via Next.js App Router, combining Edge routing, serverless compute, and decoupled persistence.

<details open>
<summary><b>View High Level Ecosystem Architecture</b></summary>

```mermaid
flowchart TB
    subgraph CLIENT["Client Layer"]
        User["End User"]
        Browser["React 19 Frontend <br/>(Tailwind + Framer Motion)"]
        User --> Browser
    end

    subgraph PROXY["Vercel Edge Network"]
        CDN["Global Edge CDN"]
        Browser --HTTPS--> CDN
    end

    subgraph SERVER["Next.js Serverless Platform"]
        direction TB
        AppRouter["App Router (app/)"]
        ServerComponents["React Server Components<br/>(Initial Render / SEO)"]
        APIRoutes["Route Handlers<br/>(app/api/*)"]
        
        AppRouter --> ServerComponents
        AppRouter --> APIRoutes
        CDN --> AppRouter
    end

    subgraph EXTERNAL["External Identity & Services"]
        Google["Google OAuth 2.0"]
        LinkedIn["LinkedIn API (Verification)"]
        DigiLocker["DigiLocker API (Fallback Auth)"]
        Pusher["Pusher Channels (WebSockets)"]
        APIRoutes -.-> Google & LinkedIn & DigiLocker
        APIRoutes --> Pusher
    end

    subgraph DATA["Data Persistence Layer"]
        Prisma["Prisma ORM Client"]
        NeonDB["Neon Serverless PostgreSQL<br/>(Connection Pooling)"]
        APIRoutes --> Prisma
        Prisma --> NeonDB
    end

    Browser <-->|WebSocket| Pusher
```
</details>

---

## <span id="3-detailed-architecture-breakdown">3. Detailed Architecture Breakdown</span>

### Frontend (User Interface)
* **React 19 & Next.js 15 App Router**: Leveraging the newest React primitives (concurrent rendering, server components) for an exceptionally fast First Contentful Paint.
* **Zustand State Management**: Avoids generic React Context bloat. Used primarily for User Session State (`useAuthStore`) and local UI toggles.
* **TailwindCSS & Framer Motion**: All components belong to a custom Neuromorphic design system that leans heavily into fluid CSS variable theming and layout animations.

### Backend (Route Handlers)
* **Stateless JWT Auth**: Next.js API Routes handle all `POST /api/auth/*` requests. Tokens are structurally verified using lightweight standards. Database touches only happen to update tracking timestamps (`lastSeenAt`).
* **Prisma singleton**: Prisma Client is instantiated globally to prevent exhausting Postgres connections during hot reloads or serverless horizontally scaling events.

### Data (Neon Serverless Postgres)
* **Neon**: Scales compute on-demand and down to zero when idle. Connected strictly via Prisma over secure TLS connections using robust pooling protocols. Extensible schema supports massive datasets seamlessly.

---

## <span id="4-low-level-architecture">4. Low-Level Architecture</span>

The Next.js Request Lifecycle mapping from incoming API call to Database Response.

<details>
<summary><b>View Execution Flow</b></summary>

```mermaid
flowchart TB
    Req["Incoming HTTP Request"] --> Middleware["Next.js Edge Middleware<br/>(matcher: /api/*)"]
    Middleware -->|Verifies Headers| RouteHandler["app/api/[module]/route.ts"]
    RouteHandler --> LibAuth["lib/auth.ts<br/>(extractToken, getUser)"]
    LibAuth -->|Authorized| DBQuery["lib/db.ts<br/>(Prisma Invocation)"]
    DBQuery -->|Awaits| Postgres["Neon DB Execution"]
    Postgres -->|Returns Payload| RouteHandler
    RouteHandler --> Res["NextResponse.json()"]
```
</details>

---

## <span id="5-terraform-infra-map">5. Terraform Infra Map</span>

If deploying to AWS directly rather than Vercel, the Terraform setup provisions exactly what Next.js abstracts away.

<details>
<summary><b>View Terraform Diagram</b></summary>

```mermaid
flowchart TB
    TF[Terraform State] --> VPC[VPC & Networking]
    TF --> S3[S3 Bucket - Static Assets]
    TF --> CF[CloudFront Distribution]
    TF --> APIGW[API Gateway HttpApi]
    TF --> Lambda[Lambda Serverless-HTTP Next.js Adapter]
    TF --> RDS[Aurora Serverless v2 PostgreSQL]
    
    subgraph VPC_Config
        VPC --> PubSub[Public Subnets]
        VPC --> PrivSub[Private Subnets]
        PubSub --> IGW[Internet Gateway]
        PrivSub --> RDS
        Lambda -->|VPC ENI Bind| PrivSub
    end
```
</details>

---

## <span id="6-cicd-pipeline">6. CI/CD Pipeline</span>

StatWoX enforces a rigorous pipeline utilizing GitHub Actions. Code must pass syntax, type-check, and exactly 191+ Unit Tests before merging.

<details>
<summary><b>View CI/CD Flow</b></summary>

```mermaid
flowchart LR
    Dev("Developer Push") --> PreFlight("Lint & Typecheck (Next lint, tsc)")
    PreFlight --> UnitTests("Vitest Execution (Auth, Survey, Analytics)")
    UnitTests -->|100% Pass| Docker("Container Build & Registry Push")
    Docker --> DeployProd("Terraform Apply / Vercel Deploy Hook")
    DeployProd --> Live("Production Live")
```
</details>

---

## <span id="7-authentication-sequence-diagram">7. Authentication Sequence Diagram</span>

StatWoX utilizes standard Email/Password paired with a Google OAuth bypass, topped with a professional verification lock.

<details>
<summary><b>View Authentication Flow</b></summary>

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NextAuthRoute as API /auth/*
    participant ExtProvider as Google/LinkedIn
    participant DB as Neon PostgreSQL

    %% Registration & Login
    Note over User, DB: Core Login & Authentication
    User->>Frontend: Clicks "Sign in with Google"
    Frontend->>ExtProvider: Initiates OAuth Pop-up
    ExtProvider-->>Frontend: Returns ID_TOKEN
    Frontend->>NextAuthRoute: POST { token: ID_TOKEN }
    NextAuthRoute->>ExtProvider: Validates Audience & Signature
    ExtProvider-->>NextAuthRoute: User Payload Structure
    NextAuthRoute->>DB: Upsert User (creates session)
    DB-->>NextAuthRoute: User Record
    NextAuthRoute-->>Frontend: 200 OK + JWT Signed Session

    %% Publishing & Trust Verification
    Note over User, DB: The Trust Verification Pipeline
    User->>Frontend: Toggles Survey visibility to "Public"
    Frontend->>NextAuthRoute: PATCH /api/surveys/[id] { isPublic: true }
    NextAuthRoute->>DB: Check user.isVerified
    DB-->>NextAuthRoute: { isVerified: false }
    NextAuthRoute-->>Frontend: 403 Forbidden (Identity Required)
    
    Frontend-->>User: Displays "Why Verification Required" Modal
    User->>Frontend: Clicks "Verify with LinkedIn"
    Frontend->>ExtProvider: Initiates Verification OAuth Flow
    ExtProvider-->>NextAuthRoute: Verified Professional Identity
    NextAuthRoute->>DB: Update user { isVerified: true, method: "LINKEDIN" }
    NextAuthRoute-->>Frontend: Trust Layer Unlocked
    Frontend->>NextAuthRoute: Retry PATCH /api/surveys/[id] { isPublic: true }
    NextAuthRoute-->>Frontend: 200 OK (Survey on Social Feed)
```
</details>

---

## <span id="8-survey-creation-pipeline">8. Survey Creation Pipeline</span>

From the drag-and-drop builder to persistence.

<details>
<summary><b>View Survey Builder Flow</b></summary>

```mermaid
flowchart LR
    User -->|Builds Question Array| Frontend
    Frontend -->|POST /api/surveys| Route
    Route -->|Extracts JWT| Middle
    Middle -->|Valid| Zod[Zod Payload Validation]
    Zod -->|Fails| Reject[400 Error]
    Zod -->|Passes| Transact[Prisma Transaction Write]
    Transact -->|Writes Survey + Questions| DB
    DB --> Route
    Route -->|JSON Config| Frontend
    Frontend -->|Redirect| SurveyDashboard
```
</details>

---

## <span id="9-data-flow">9. Data Flow (Analytics Aggregation)</span>

How raw user answers convert into graphical insights.

<details>
<summary><b>View Responses to Analytics Flow</b></summary>

```mermaid
flowchart TB
    Respond[POST /api/surveys/:id/respond] --> API_Respond[Stores raw JSON in DB Response/Answer tables]
    API_Respond --> Pusher[Pusher Publish Real-Time Event]
    
    subgraph Data Analytics Endpoint
        ChartQuery[GET /api/surveys/:id/analytics] --> FetchDB[Fetches Survey tree + Responses array]
        FetchDB --> Math[Math Module: Calculate Averages, Conversion Rates, Timeline Dates]
        Math --> Mapper[Transforms to Arrays for Recharts UI]
    end

    ClientChart[Recharts Component] -->|Calls initially| ChartQuery
    ClientChart -->|Listens| Pusher
    Pusher -.->|Triggers Refetch| ChartQuery
```
</details>

---

## <span id="10-backend-internal-module-graph">10. Backend Internal Module Graph</span>

<details>
<summary><b>View Internal Next.js Logic Architecture</b></summary>

```mermaid
---
config:
  theme: dark
  layout: dagre
---
flowchart LR
 subgraph ClientUI["Frontend UI"]
        UI1["Global Auth Context<br/>(useAuthStore)"]
        UI2["Survey Builder Canvas"]
        UI3["Responses / Charts"]
        UI4["Public Social Feed"]
        UI5["Profile & Settings"]
  end
 subgraph Config["Global Middleware Context"]
        NextMiddleware["middleware.ts<br/>(Edge Execution)"]
        AuthLib["lib/auth.ts<br/>(JWT Verify)"]
        DBLib["lib/db.ts<br/>(Prisma Client singleton)"]
  end
 subgraph APIRoutes["API Route Handlers (/api/*)"]
        R_Auth["/auth/me<br/>/auth/login<br/>/auth/google"]
        R_Verify["/auth/verify/linkedin"]
        R_Survey["/surveys (CRUD)"]
        R_Respond["/surveys/:id/respond"]
        R_Analysis["/surveys/:id/analytics"]
        R_Feed["/feed (Pagination)"]
  end

    UI1 <--> R_Auth
    UI5 --> R_Verify
    UI2 <--> R_Survey
    UI3 <-- Polling --> R_Analysis
    UI4 <--> R_Feed
    
    R_Auth & R_Verify & R_Survey & R_Respond & R_Analysis & R_Feed --> NextMiddleware
    NextMiddleware --> AuthLib
    
    R_Auth & R_Verify & R_Survey & R_Respond & R_Analysis & R_Feed --> DBLib
```
</details>

---

## <span id="11-tech-stack">11. ⚙️ Tech Stack</span>

| Frontend & Logic | Backend & Architecture | Data | Testing |
| :---: | :---: | :---: | :---: |
| <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /> | <img src="https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white" /> | <img src="https://img.shields.io/badge/Neon_DB-00E599?style=for-the-badge&logo=neon&logoColor=black" /> | <img src="https://img.shields.io/badge/Vitest-729B1B?style=for-the-badge&logo=vitest&logoColor=white" /> |
| <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> | <img src="https://img.shields.io/badge/Node.js_20-43853D?style=for-the-badge&logo=node.js&logoColor=white" /> | <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" /> | |
| <img src="https://img.shields.io/badge/Zustand-764ABC?style=for-the-badge" /> | <img src="https://img.shields.io/badge/JWT_Auth-black?style=for-the-badge&logo=json-web-tokens&logoColor=white" /> | | |
| <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" /> | | | |
| <img src="https://img.shields.io/badge/Dnd_Kit-EC5990?style=for-the-badge&logo=react&logoColor=white" /> | | | |

---

## <span id="12-entire-db-schema">12. 🗄️ Entire DB Schema</span>

StatWoX maintains an incredibly detailed, relational database model managing core surveys, logic dependencies, social features, RBAC workspaces, audit logs, and trust identities.

<details open>
<summary><b>View Master Entity Relationship Diagram (ERD)</b></summary>

```mermaid
erDiagram
    %% Core Entities
    User ||--o{ Survey : creates
    User ||--o{ Response : submits
    Survey ||--o{ Question : contains
    Survey ||--o{ Response : tracks
    Question ||--o{ Answer : receives
    Response ||--o{ Answer : contains

    %% Social Features
    User ||--o{ Comment : writes
    User ||--o{ Like : gives
    User ||--o{ Notification : receives
    User ||--o{ Friendship : sends
    User ||--o{ Friendship : receives
    Survey ||--o{ Comment : has
    Survey ||--o{ Like : has
    Comment ||--o{ Comment : replies

    %% Enterprise Features
    User ||--o{ QuestionBank : owns
    User ||--o{ Workspace : owns
    User ||--o{ WorkspaceMember : belongs_to
    Survey ||--o{ SurveyVersion : versions
    Survey ||--o{ ScheduledReport : triggers
    Workspace ||--o{ Survey : contains
    Workspace ||--o{ WorkspaceMember : has
    User ||--o{ AuditLog : performs
    User ||--o{ Template : authors

    User {
        String id PK
        String email UK
        String username UK
        String passwordHash
        String name
        Boolean isOnline
        String googleId UK "Optional"
        Boolean isVerified
        String verificationMethod "NONE, LINKEDIN, DIGILOCKER"
    }
    
    Survey {
        String id PK
        String title
        String status "DRAFT, PUBLISHED, CLOSED"
        Boolean isPublic "Requires isVerified=true"
        String category "survey, poll, form"
        Int viewCount
        Int responseCount
        String authorId FK
        String workspaceId FK
    }
    
    Question {
        String id PK
        String type "shortText, multipleChoice, rating, etc."
        Boolean required
        Json options
        Json logic "Skip Logic Tree"
        String surveyId FK
    }

    Response {
        String id PK
        Boolean isComplete
        DateTime startedAt
        Json metadata "IP, Geo, Device"
        String surveyId FK
        String respondentId FK "Optional"
    }

    Answer {
        String id PK
        String value
        String fileUrl "Optional Uploads"
        String questionId FK
        String responseId FK
    }
    
    Workspace {
        String id PK
        String name
        String slug UK
        String ownerId FK
    }

    AuditLog {
        String id PK
        String action "create, update, delete"
        String entityType
        String entityId
        String userId FK
        Json metadata
    }
```
</details>

---

## <span id="13-local-setup-guide">13. 💻 Local Setup Guide</span>

<details>
<summary><b>Click to expand</b></summary>

### 1. Requirements

Ensure you are using `node == 20` and `bun` package manager. If on Windows, it is highly recommended to run this inside WSL (Ubuntu).

### 2. Clone & Install

```bash
git clone https://github.com/MrCh0p808/StatWoX.git
cd StatWoX
bun install
```

### 3. Environment Variables

Create `.env`:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/statwox?schema=public"
JWT_SECRET="your_32_char_secure_local_secret"
# Add Google OAuth variables (Optional for local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxx"
```

### 4. Database Setup

```bash
bun run db:push
bun run db:generate
bun run db:seed
```

### 5. Start Development Server

```bash
bun run dev
```

The app will be available at `http://localhost:8000`.

### 6. Run Test Suite

```bash
bun run test
```
The codebase enforces 190+ strict unit tests via Vitest spanning Auth, Surveys, and Analytics APIs.

</details>

---

## <span id="14-production-deployment-terraform">14. Production Deployment Terraform</span>

<details>
<summary><b>Click to expand</b></summary>

While development utilizes Vercel for isolated branches, production infrastructure is defined completely via Terraform targeting AWS directly if self-hosted.

1. **Build Containerized Output**:
   ```bash
   bun run build
   ```

2. **Deploy Infra**:
   ```bash
   cd terraform
   terraform init
   terraform apply
   ```
   *(Enter your DB credentials and secrets when prompted. This spins up the VPC, Aurora cluster, CloudFront caching layers, and API Gateways).*

</details>

---

## <span id="15-api-reference">15. 🔌 API Reference</span>

StatWoX acts as a REST strict platform. Payloads must contain valid JWT `Authorization: Bearer <token>` strings unless specifically allowed to anonymous entities.

*   **Auth:** 
    * `POST /api/auth/register` (Username, Email, Password)
    * `POST /api/auth/login` (Email, Password)
    * `GET /api/auth/me` (Validates and returns current profile)
    * *Upcoming in Phase 3.5:* `POST /api/auth/oauth/google`, `POST /api/auth/verify/linkedin`
*   **Surveys Core:** 
    * `GET /api/surveys` (Lists author's surveys)
    * `POST /api/surveys` (Instantiates payload)
    * `GET /api/surveys/:id` (Returns Survey shape and active Questions)
    * `PATCH /api/surveys/:id` (Performs full atomic overwrite on metadata/questions arrays)
*   **Responses:** 
    * `POST /api/surveys/:id/respond` (Handles duplicate prevention and logic validation)
*   **Analytics:** 
    * `GET /api/surveys/:id/analytics` (Generates time-series data and distribution charts)
*   **Feed:** 
    * `GET /api/feed` (Returns offset paginated array of public surveys)

---

## <span id="16-contributing-guide">16. 🤝 Contributing Guide</span>

StatWoX is developed strictly beneath the **CodeSwami Protocol**. PRs should address specific isolated waves from the Master Plan.

*   `feat/*`: New features
*   `fix/*`: Bug fixes
*   `test/*`: Test coverage expansions (Aim for Vitest coverage increases)

Commit format implies clear intent. Before raising a PR, ensure all 191+ Unit Tests pass natively using `bun run test`.

---

## <span id="17-changelog">17. 📜 Changelog</span>

### v1.1.0 (Phase 3 Execution)
*   **Core**: Finalized Next.js App Router codebase conversion.
*   **Feature**: 191+ Atomic Unit Tests deployed globally protecting APIs.
*   **Security**: Scraped memory-leaks and hardcoded PII disclosures in HTTP Handlers.
*   **Feature**: Upcoming Trust Identity System mapped out inside Schema.

### v1.0.0
*   **Core**: Initial release.
*   **Feature**: Complete Survey Builder UI.
*   **Infra**: Full Terraform deployment suite.
