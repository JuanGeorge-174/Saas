# Security & Performance Audit

## 1. Threat Model Analysis

| Threat | Mitigation Strategy | Implemented |
| :--- | :--- | :--- |
| **Data Leakage (Cross-Clinic)** | Strict `clinicId` injection in **every** API handler before DB query. Protected by RBAC middleware. | ✅ Yes |
| **Privilege Escalation** | `role` is stored in signed JWT (server-side only). Role checks in `gards.js` are explicit (Allow-list). | ✅ Yes |
| **Brute Force Attacks** | DB-based Rate Limiting (Token Bucket) on `/api/auth/login`. Locks by IP. | ✅ Yes |
| **XSS (Cross-Site Scripting)** | `HttpOnly` cookies for tokens. No sensitive data in DOM. | ✅ Yes |
| **CSRF (Cross-Site Request Forgery)** | `SameSite=Strict` cookie policy. | ✅ Yes |
| **Weak Passwords** | `bcrypt` hashing with 12 rounds. Enforced validation on signup (future). | ✅ Yes |

## 2. Scalability & Performance

*   **Stateless Ops**: Authentication is JWT-based; no session store required (Redis optional but not needed for MVP).
*   **Database**:
    *   Indexes applied on high-cardinality fields (`clinicId`, `email`, `phone`).
    *   Rate limiting uses MongoDB TTL indexes (auto-cleanup).
*   **Edge Compatibility**: Middleware designed for Vercel Edge Runtime (lightweight checks).

## 3. Deployment Checklist

1.  [ ] Set `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` to long random strings in environment variables.
2.  [ ] Set `NODE_ENV=production` to enable Secure (HTTPS) cookies.
3.  [ ] Configure MongoDB Atlas IP Whitelist.

## 4. Known Limitations (MVP)

*   **No 2FA**: Currently password-only.
*   **Audit Logging**: Basic "CreatedBy" fields exist, but a full audit change-log collection is not yet active.
*   **File Storage**: Patient X-Rays/Files implementation deferred (Need S3/Blob storage).
