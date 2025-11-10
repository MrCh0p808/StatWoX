# StatWoX — The Hybrid Roadmap: Best of Both Worlds

## ⚙️ Vision

StatWoX stands at the intersection of creator-driven content and data-driven insight — a **personal platform for real engagement**. The goal is to empower creators (you) to host surveys, collect real-time insights, and interact with audiences through facts, not algorithms — all within a scalable, cost-optimized architecture.

This roadmap fuses the strengths of your current setup (simplicity, low cost, and flexibility) with professional-grade standards (security, modular design, CI/CD, observability, and scalability).

---
```mermaid
gantt
    title StatWoX — Full Hybrid Roadmap (MVP → Production)
    dateFormat  YYYY-MM-DD
    section Phase 1 — Refactor & Secure
    Migrate questions to /i18n/questions/{lang}.json :done, p1a, 2025-11-10, 5d
    Move credentials to Secrets Manager :done, p1b, after p1a, 3d
    Harden Lambda validation + idempotency :done, p1c, after p1b, 3d
    Update Terraform backend + tagging :done, p1d, after p1c, 2d
    Add consent/PII disclaimer to frontend :active, p1e, after p1d, 2d

    section Phase 2 — Observability & CI/CD
    Add CloudWatch metrics + alerting :p2a, 2025-11-20, 4d
    Implement GitHub Actions pipeline :p2b, after p2a, 5d
    Configure staging environment :p2c, after p2b, 3d
    Add Slack/Webhook notifications :p2d, after p2c, 2d

    section Phase 3 — Data Evolution
    Integrate DynamoDB for primary writes :p3a, 2025-12-01, 7d
    Introduce SNS async export to Google Sheets :p3b, after p3a, 4d
    Build basic analytics dashboard (S3 static + REST API) :p3c, after p3b, 6d

    section Phase 4 — Growth & Scale
    Add Cognito lightweight auth :p4a, 2025-12-15, 5d
    Integrate WAF for traffic filtering :p4b, after p4a, 3d
    Add CDN caching + optimized analytics :p4c, after p4b, 5d
    Launch community feedback surveys :p4d, after p4c, 5d

    section Phase 5 — Creator Console & Viral Mode
    Develop content console (React + FastAPI backend) :p5a, 2026-01-10, 14d
    Host multiple surveys per creator :p5b, after p5a, 7d
    Implement real-time stats view (WebSockets/SSE) :p5c, after p5b, 10d
    Add freemium analytics dashboard logic :p5d, after p5c, 10d

    section Cost Monitoring & Free Tier Boundaries
    Monitor AWS free-tier usage (Lambda/API Gateway/DynamoDB) :p6a, 2025-11-15, 90d
    Set CloudWatch billing alert threshold ($5) :p6b, after p6a, 1d
    Enable cost tags and reports in AWS Cost Explorer :p6c, after p6b, 1d
    Review monthly usage to stay under free limits :p6d, after p6c, 30d

    section Risk & Scale Triggers
    Lambda > 1M requests/month → consider concurrency cap :crit, p7a, 2025-12-01, 1d
    API Gateway > 1M calls/month → plan for rate limiting :crit, p7b, after p7a, 1d
    CloudFront egress > 1TB/month → add CDN cache strategy :crit, p7c, after p7b, 1d
    DynamoDB read/write units > 25/25/month → switch to provisioned mode :crit, p7d, after p7c, 1d

    section Continuous Improvement
    Collect community feedback & analytics reports :p8a, 2026-02-01, 30d
    Optimize cost + performance based on metrics :p8b, after p8a, 10d
    Prepare v2 product roadmap for StatWoX Pro :p8c, after p8b, 14d
```
---
## 🧩 Architectural Philosophy

| Aspect               | MVP (Now)                                  | Scalable Upgrade                                              |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------- |
| **Frontend**         | Static SPA (React/Tailwind, S3/CloudFront) | Progressive Web App (Next.js, offline cache, API-driven i18n) |
| **Backend**          | Lambda + Google Sheets                     | Lambda + DynamoDB + optional Google Sheets export             |
| **Secrets**          | Env vars in Terraform                      | AWS Secrets Manager (fetched at runtime)                      |
| **Data Flow**        | Direct write → Google Sheets               | Event-driven (Lambda → DynamoDB → SNS → Sheets async)         |
| **Auth & Identity**  | None                                       | Cognito / Email Token Auth (minimal friction)                 |
| **Infra Management** | Terraform local backend                    | Terraform remote (S3 + DynamoDB lock + tagging)               |
| **CI/CD**            | Manual deploys                             | GitHub Actions: test, build, validate, deploy                 |
| **Monitoring**       | CloudWatch basic logs                      | Structured logs + Grafana dashboard + Alerts                  |

## 🧱 Core Layers Breakdown

### 1️⃣ Frontend Layer

* Refactor question logic into external `i18n/questions/{lang}.json` files.
* Add a language selector; preload translations from CDN.
* Integrate analytics hooks (track question completion, drop-offs).
* Improve accessibility (keyboard, ARIA roles, responsive typography).
* Add **local caching** (IndexedDB) for offline response storage.

### 2️⃣ Backend Layer (Lambda API)

* Keep Google Sheets write-through for now, but **introduce DynamoDB** for structured storage:

  * Partition key: `survey_id`
  * Sort key: `response_id`
  * Global secondary index: `timestamp` for analytics.
* Lambda workflow:

  1. Validate & sanitize payload.
  2. Check idempotency via `session_id + survey_id`.
  3. Write to DynamoDB.
  4. Publish SNS event for async Google Sheets export.
  5. Return a success response with `response_token`.

### 3️⃣ Infrastructure Layer (Terraform)

* Consolidate all envs (`dev`, `prod`) with a single Terraform workspace.
* Use variable-driven naming conventions and tags.
* Migrate all secrets → AWS Secrets Manager.
* Re-enable ACM + CloudFront + WAF for HTTPS & spam protection.
* Use DynamoDB for state locking and metadata tracking.

### 4️⃣ Security & Privacy Layer

* Add consent checkbox and PII disclaimer.
* Implement CloudFront WAF rules for bot protection.
* Anonymize or hash PII in DynamoDB before analytics aggregation.
* Rotate all secrets every 90 days automatically.

### 5️⃣ Observability Layer

* Add JSON logging in Lambda (`level`, `message`, `reqId`, `timestamp`).
* Use CloudWatch metric filters for error rates, latency, and throttling.
* Integrate Grafana dashboard for response trends.
* Optional: Send Slack alerts for error spikes.

### 6️⃣ CI/CD Layer (GitHub Actions)

* Pipeline stages:

  1. Lint + format + test frontend.
  2. Terraform validate + plan (PR only).
  3. Zip Lambda → upload to S3 artifact.
  4. Deploy infra + frontend + Lambda (on merge to `main`).
* Inject env vars securely via GitHub Secrets:

  ```yaml
  env:
    API_URL: ${{ secrets.API_URL }}
    GOOGLE_CREDS_SECRET_ARN: ${{ secrets.GOOGLE_CREDS_SECRET_ARN }}
    SHEET_ID: ${{ secrets.SHEET_ID }}
  ```

---

## 🧠 Best of Both Worlds — Philosophy

**From Google Sheets simplicity → to DynamoDB robustness**.

1. **Use Google Sheets for visibility:** easy exports for non-technical stakeholders.
2. **Use DynamoDB for durability:** instant reads, structured queries, low-latency aggregation.
3. **Combine both via async pipelines:** maintain flexibility and professional reliability.

This dual-system architecture means you can grow without breaking your startup budget — free-tier where possible, scale-tier when viral.

---

## 🪜 Final Roadmap (Phased Implementation)

### 🔹 Phase 1 — "Refactor & Secure" (0–2 Weeks)

* [x] Migrate question data to `/i18n/questions/{lang}.json`.
* [x] Move credentials to Secrets Manager.
* [x] Harden Lambda validation + idempotency.
* [x] Update Terraform state backend + tagging.
* [ ] Add consent/PII disclaimer to frontend.

### 🔹 Phase 2 — "Observability & CI/CD" (3–5 Weeks)

* [ ] Add CloudWatch metrics + alerting.
* [ ] Add GitHub Actions CI/CD.
* [ ] Implement staging environment.
* [ ] Add Slack/Webhook notifications on failed deploys.

### 🔹 Phase 3 — "Data Evolution" (6–8 Weeks)

* [ ] Integrate DynamoDB for primary writes.
* [ ] Introduce SNS event for async export to Google Sheets.
* [ ] Build basic analytics dashboard (S3 static + REST API).

### 🔹 Phase 4 — "Growth & Scale" (8–12 Weeks)

* [ ] Add Cognito lightweight auth for survey owners.
* [ ] Integrate WAF for traffic filtering.
* [ ] Add CDN caching and optimized analytics pipeline.
* [ ] Begin community feedback surveys directly through StatWoX.

### 🔹 Phase 5 — "Creator Console & Viral Mode" (3–6 Months)

* [ ] Develop content console (React + FastAPI backend).
* [ ] Allow creators to host multiple surveys.
* [ ] Implement real-time stats view (WebSocket / Server-Sent Events).
* [ ] Add freemium plan logic — paid analytics dashboard (when viral).

---

## 🚀 Conclusion

StatWoX now has a dual-track foundation — **speed and simplicity of a startup, strength and scalability of a SaaS.**

The MVP remains cost-free and fast to iterate, while every upgrade builds toward a serverless, secure, fully observable, multilingual platform for truth-based engagement.

**Tagline for internal doc:**

> “From opinions to outcomes — StatWoX makes every response count.”
