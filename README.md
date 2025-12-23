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

**StatWoX is an open-source platform for forms, surveys, and polls that connects data collection directly to analysis and decision-making.**

Most tools stop at collecting responses.
Real teams struggle after that.

They collect data in one tool, analyze it elsewhere, visualize it in another place, and export results manually. Context is lost. Work is repeated. Insights arrive late.

StatWoX removes this entire gap.

---

## How StatWoX Works (End-to-End)

```mermaid
flowchart LR
    A[Create Survey / Form / Poll]
    B[Share Link · Embed · QR · Email]
    C[Collect Responses]
    D[Live Tracking]
    E[Advanced Analytics]
    F[Analytics Dashboard]
    G[Export or Decide]

    A --> B --> C --> D --> E --> F --> G
```

---

## Why StatWoX Is Different

```mermaid
flowchart TB
    subgraph Traditional Tools
        T1[Form Builder]
        T2[CSV Export]
        T3[External Analysis Tool]
        T4[Manual Charts]
        T5[Decision]

        T1 --> T2 --> T3 --> T4 --> T5
    end

    subgraph StatWoX
        S1[Data Collection]
        S2[Live Signals]
        S3[Filters & Comparisons]
        S4[Contextual Dashboard]
        S5[Export or Action]

        S1 --> S2 --> S3 --> S4 --> S5
    end
```

---

## Built for Real Data Work

```mermaid
flowchart LR
    Q[Structured Questions]
    R[Usable Data]
    A[Filtered Analysis]
    C[Comparisons · Time Views]
    I[Insights]
    O[Exports]

    Q --> R --> A --> C --> I --> O
```

---

## Designed for Developers and Decision Makers

```mermaid
flowchart LR
    D1[Developer First]
    D2[Open Source]
    D3[Serverless & Scalable]
    D4[MVP to Production]

    D1 --> D2 --> D3 --> D4
```

---

**StatWoX is not just a form builder.**
**It is an insight pipeline.**

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

1. **User Authentication**: Secure Google OAuth login with JWT session management.
2. **Personal Dashboard**: Manage, edit, and track your surveys in one place.
3. **Survey Engine**: Create dynamic surveys with various question types (text, multiple choice, rating, etc.).
4. **Serverless Backend**: Runs entirely on AWS Lambda, scaling to zero when idle.
5. **PostgreSQL Database**: Data stored reliably in Aurora Serverless v2 via Prisma ORM.
6. **Global Delivery**: Frontend cached and delivered via CloudFront Edge locations.
7. **Infrastructure as Code**: Entire stack provisioned and managed via Terraform.

Built to be scalable, reliable, and cost-efficient.

[Back to Top](#table-of-contents)

---

## <span id="architecture-diagram">Architecture Diagram</span>

<details>
<summary><b>Click to expand architecture diagram</b></summary>

```mermaid
flowchart TB
    subgraph CLIENT["User Layer"]
        User["End User"]
        Browser["Web Browser<br/>(Chrome/Safari/Edge)"]
        User --> Browser
    end

    subgraph FRONTEND["Frontend (Presentation)"]
        direction TB
        Vite["Vite Build System"]
        React["React 19 App"]
        Config["Runtime Config<br/>(config.js)"]
        Tailwind["TailwindCSS"]
        Framer["Framer Motion"]
        
        Browser --> React
        React --> Config
    end

    subgraph CDN["Edge Network (Content Delivery)"]
        CF["CloudFront Distribution<br/>(Global Edge Locations)"]
        S3["S3 Bucket<br/>(Static Assets Origin)"]
        
        React -.->|Fetch Assets| CF
        CF -->|OAC Auth| S3
    end

    subgraph BACKEND["Backend (Compute)"]
        direction TB
        APIGW["API Gateway HTTP API<br/>(v2 Proxy Integration)"]
        
        subgraph LAMBDA["AWS Lambda (ExecutionContext)"]
            Node["Node.js 20 Runtime"]
            Express["Express.js App"]
            Adapter["Serverless-HTTP Adapter"]
            
            subgraph CONTROLLERS["Controllers"]
                Auth["Auth Logic<br/>(Google/JWT)"]
                Survey["Survey Logic<br/>(CRUD)"]
                Feed["Feed Logic"]
            end
        end
        
        Browser -->|API JSON| APIGW
        APIGW -->|Payload| Adapter
        Adapter --> Express
        Express --> Auth
        Express --> Survey
        Express --> Feed
    end

    subgraph DATA["Data Persistence"]
        Prisma["Prisma ORM Client<br/>(Linux Binary)"]
        QueryEngine["Query Engine<br/>(Rust Binding)"]
        Aurora["Amazon Aurora Serverless v2<br/>(PostgreSQL)"]
        
        Auth --> Prisma
        Survey --> Prisma
        Feed --> Prisma
        Prisma --> QueryEngine
        QueryEngine -->|TCP/IP| Aurora
    end

    subgraph OBSERVE["Observability & Monitoring"]
        CW["CloudWatch Logs<br/>(/aws/lambda/statwox-submit)"]
        Metrics["CloudWatch Metrics<br/>(Errors, Duration, Throttles)"]
        Alarms["CloudWatch Alarms<br/>(5xx Errors)"]
     
        Node -.->|Stdout/Stderr| CW
        APIGW -.->|Access Logs| CW
        CW -.-> Metrics
        Metrics -.-> Alarms
    end
    
    subgraph AUTH_EXT["External Identity"]
        Google["Google Identity Services<br/>(OAuth 2.0)"]
        Browser -.->|OIDC Flow| Google
        Auth -.->|Verify Token| Google
    end

    subgraph IAC["Infrastructure as Code"]
        TF["Terraform"]
        State["Terraform State<br/>(Local/Remote)"]
        
        TF -->|Provisions| APIGW
        TF -->|Provisions| Aurora
        TF -->|Provisions| LAMBDA
        TF -->|Provisions| CF
    end
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="detailed-architecture-breakdown">Detailed Architecture Breakdown</span>

<details>
<summary><b>Click to expand</b></summary>

### Frontend

* **React 19**: Utilizing the latest features for optimal performance and concurrent rendering.
* **TypeScript**: Strict typing ensures codebase reliability and developer productivity.
* **Vite**: Ultra-fast build tool and dev server.
* **Tailwind CSS**: Utility-first styling for rapid UI development.
* **Framer Motion**: Smooth, complex animations for a premium user feel.
* **Runtime Config**: Environment variables injected via `config.js` at runtime, ensuring "build once, deploy anywhere".

### Backend

* **Serverless Express**: Express.js application wrapped with `serverless-http` to run seamlessly on AWS Lambda.
* **Google OAuth**: Secure server-side verification of Google ID tokens using `google-auth-library`.
* **Prisma ORM**: Type-safe database access. (Binaries are manually copied to `dist/` to ensure compatibility with Amazon Linux 2).
* **Stateless**: No sessions stored in memory; relies on JWTs signed with a secure secret.

### Infrastructure

* **Terraform Managed**: 100% of the infrastructure (VPC, Lambda, DB, CDN) is defined in HCL.
* **VPC Isolation**: Database resides in a private subnet, inaccessible from the public internet.
* **CloudFront OAC**: Secure S3 access using Origin Access Control, ensuring users only access files via the CDN.
* **Aurora Serverless v2**: Automatically scales compute capacity based on load, pausing costs during inactivity.

### Build and Deploy Flow

1. **Frontend**: Built via Vite (`npm run build`) -> `dist/` -> Sync to S3.
2. **Backend**: Bundled via esbuild (`build.js`) -> `lambda.zip` (includes Prisma binaries) -> Upload to Lambda.
3. **Terraform**: `terraform apply` manages state and updates AWS resources.
4. **Config Injection**: Terraform outputs API URL and Client ID -> `config.js` uploaded to S3.

</details>

[Back to Top](#table-of-contents)

---

## <span id="low-level-architecture">Low-Level Architecture</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
flowchart TB
    Entry["lambda.ts<br/>(Handler Entry)"] --> Express["app.ts<br/>(Express App)"]
    Express --> Middleware["Middleware<br/>(CORS, Auth Guard)"]
    Middleware --> Routes["Routes<br/>(/auth, /surveys)"]
    Routes --> Controllers["Controllers<br/>(Business Logic)"]
    Controllers --> PrismaClient["Prisma Client<br/>(Data Access)"]
    PrismaClient --> QueryEngine["Prisma Query Engine<br/>(Rust Binary)"]
    QueryEngine --> PostgreSQL["PostgreSQL Connections"]
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="terraform-infra-map">Terraform Infrastructure Map</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
flowchart TB
    TF[Terraform State] --> VPC[VPC & Networking]
    TF --> S3[S3 Bucket]
    TF --> CF[CloudFront Distribution]
    TF --> APIGW[API Gateway]
    TF --> Lambda[Lambda Function]
    TF --> RDS[Aurora RDS Cluster]
    
    subgraph VPC_Config
        VPC --> PubSub[Public Subnets]
        VPC --> PrivSub[Private Subnets]
        PubSub --> IGW[Internet Gateway]
        PrivSub --> RDS
        Lambda -->|ENI| PrivSub
    end
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="authentication-sequence-diagram">Authentication Sequence Diagram</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Google
    participant DB

    User->>Frontend: Clicks "Sign in with Google"
    Frontend->>Google: Pop-up Login Flow
    Google-->>Frontend: Returns ID Token
    Frontend->>Backend: POST /api/auth/google<br/>{ credential: ID_TOKEN }
    Backend->>Google: Verify Token Integrity<br/>(Audience Check)
    Google-->>Backend: Token Valid + User Payload
    Backend->>DB: Prisma Upsert User<br/>(Create if new)
    DB-->>Backend: User Record
    Backend->>Frontend: Return Signed JWT
    Frontend->>Frontend: Store JWT in LocalStorage
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="survey-creation-pipeline">Survey Creation Pipeline</span>

<details>
<summary><b>Click to expand</b></summary>

```mermaid
flowchart LR
    User -->|Input Form| Frontend
    Frontend -->|POST /api/surveys| APIGW
    APIGW -->|Proxy| Lambda
    Lambda -->|Auth Check| MiddlewareJWT
    MiddlewareJWT -->|Valid| Controller
    Controller -->|Prisma Create| DB
    DB -->|Survey ID| Lambda
    Lambda -->|JSON Response| Frontend
    Frontend -->|Redirect| SurveyBuilder
```

</details>

[Back to Top](#table-of-contents)

---

## <span id="tech-stack">Tech Stack</span>

| Frontend | Backend | Infrastructure | Tools |
| :---: | :---: | :---: | :---: |
| <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /> | <img src="https://img.shields.io/badge/Node.js_20-43853D?style=for-the-badge&logo=node.js&logoColor=white" /> | <img src="https://img.shields.io/badge/AWS_Lambda-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" /> | <img src="https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white" /> |
| <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /> | <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" /> | <img src="https://img.shields.io/badge/API_Gateway-FF4F8B?style=for-the-badge&logo=amazon-api-gateway&logoColor=white" /> | <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" /> |
| <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" /> | <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white" /> | <img src="https://img.shields.io/badge/CloudFront-D05C42?style=for-the-badge&logo=amazon-aws&logoColor=white" /> | <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" /> |
| <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" /> | <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" /> | <img src="https://img.shields.io/badge/Amazon_S3-569A31?style=for-the-badge&logo=amazon-s3&logoColor=white" /> | <img src="https://img.shields.io/badge/ESBuild-FFCF00?style=for-the-badge&logo=javascript&logoColor=white" /> |
| | <img src="https://img.shields.io/badge/JWT-Auth-black?style=for-the-badge&logo=json-web-tokens&logoColor=white" /> | <img src="https://img.shields.io/badge/Aurora_v2-527FFF?style=for-the-badge&logo=amazon-rds&logoColor=white" /> | <img src="https://img.shields.io/badge/Google_Auth-4285F4?style=for-the-badge&logo=google&logoColor=white" /> |

[Back to Top](#table-of-contents)

---

## <span id="local-setup-guide">Local Setup Guide</span>

<details>
<summary><b>Click to expand</b></summary>

### 1. Clone Repository

```bash
git clone https://github.com/MrCh0p808/StatWoX.git
cd StatWoX
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```
DATABASE_URL="postgresql://user:pass@localhost:5432/statwox?schema=public"
JWT_SECRET="your_local_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
```

Start the local server (uses `nodemon`):

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will proxy API requests to `http://localhost:5000` via Vite config.

</details>

[Back to Top](#table-of-contents)

---

## <span id="production-deployment-terraform">Production Deployment (Terraform)</span>

<details>
<summary><b>Click to expand</b></summary>

1. **Build Backend**:
   ```bash
   cd backend && node build.js
   ```
   *(This script handles bundling and copying Prisma binaries)*

2. **Build Frontend**:
   ```bash
   cd frontend && npm run build
   ```

3. **Deploy Infra**:
   ```bash
   cd infra
   terraform init
   terraform apply
   ```
   *(Enter your DB credentials and secrets when prompted)*

4. **Upload Config**:
   The Terraform output will provide the API URL. Update `config.js` in the S3 bucket.

</details>

[Back to Top](#table-of-contents)

---

## <span id="api-reference">API Reference</span>

*   `POST /api/auth/google`: Exchange Google ID token for Session JWT.
*   `GET /api/surveys`: List user's surveys.
*   `POST /api/surveys`: Create a new survey.
*   `GET /api/surveys/:id`: Get full survey details.
*   `POST /api/surveys/:id/responses`: Submit a survey response (public).

[Back to Top](#table-of-contents)

---

## <span id="contributing-guide">Contributing Guide</span>

Branch naming:

* `feat/*`: New features
* `fix/*`: Bug fixes
* `infra/*`: Terraform changes
* `docs/*`: Documentation updates

Commit format implies clear intent.

[Back to Top](#table-of-contents)

---

## <span id="changelog">Changelog</span>

### v1.0.0

*   **Core**: Initial release.
*   **Feature**: Google OAuth Integration.
*   **Feature**: Complete Survey Builder UI.
*   **Infra**: Full Terraform deployment suite.
*   **Fix**: Resolved Prisma binary compatibility for AWS Lambda (Amazon Linux 2).

[Back to Top](#table-of-contents)

