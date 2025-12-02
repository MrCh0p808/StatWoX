# Frontend to Backend API Contract

| Frontend Action | Frontend Path (via `API_BASE_URL`) | Method | Backend Route | Controller | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | | | | | |
| Login (Email) | `/api/auth/login` | POST | `/api/auth/login` | `auth.ts` | Expects `{email, password}`. Returns `{token}`. |
| Register | `/api/auth/register` | POST | `/api/auth/register` | `auth.ts` | Expects `{email, password, username}`. Returns `{token}`. |
| Google Login | `/api/auth/google` | POST | `/api/auth/google` | `auth.ts` | Expects `{credential}`. Returns `{token}`. |
| OTP Send | `/api/auth/otp/send` | POST | `/api/auth/otp/send` | `otp.ts` | Expects `{phone}`. Returns `{message}`. |
| OTP Verify | `/api/auth/otp/verify` | POST | `/api/auth/otp/verify` | `otp.ts` | Expects `{phone, code}`. Returns `{token}`. |
| **Surveys** | | | | | |
| List Surveys | `/api/surveys` | GET | `/api/surveys` | `surveys.ts` | Returns `Survey[]`. |
| Create Survey | `/api/surveys` | POST | `/api/surveys` | `surveys.ts` | Expects `{title, questions}`. |
| Get Survey | `/api/surveys/:id` | GET | `/api/surveys/:id` | `surveys.ts` | Returns `Survey` with questions. |
| Update Survey | `/api/surveys/:id` | PUT | `/api/surveys/:id` | `surveys.ts` | Expects `{title, questions}`. |
| Delete Survey | `/api/surveys/:id` | DELETE | `/api/surveys/:id` | `surveys.ts` | |
| **Responses** | | | | | |
| Submit Response | `/api/surveys/:id/responses` | POST | `/api/surveys/:id/responses` | `surveys.ts` | Expects `{answers}`. |
| **Analytics** | | | | | |
| Get Analytics | `/api/surveys/:id/analytics` | GET | `/api/surveys/:id/analytics` | `analytics.ts` | Returns stats. |
| **Feed/Notifications** | | | | | |
| Get Feed | `/api/feed` | GET | `/api/feed` | `feed.ts` | |
| Get Notifications | `/api/notifications` | GET | `/api/notifications` | `notifications.ts` | |
