# Stage 1: System Architecture & Security Design

## 1. Folder Structure (Next.js 14+ App Router)

```text
src/
├── app/
│   ├── (auth)/             # Public authentication routes
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (dashboard)/        # Protected application routes (Layout with Sidebar)
│   │   ├── admin/          # Role: Admin only
│   │   ├── doctor/         # Role: Doctor (read/write clinical)
│   │   ├── reception/      # Role: Receptionist (read/write CRM/scheduling)
│   │   ├── profile/        # Shared profile settings
│   │   └── layout.js       # Dashboard layout (Shell)
│   ├── api/                # Stateless API Endpoints (Versioned internally via folder)
│   │   ├── auth/           # Login, Logout, Refresh, Me
│   │   ├── admin/          # Clinic & User management
│   │   ├── patients/       # Patient CRUD
│   │   ├── appointments/   # Scheduling logic
│   │   ├── clinical/       # Notes & History
│   │   ├── crm/            # Communications & Tasks
│   │   └── reports/        # Read-only aggregations
│   ├── global-error.js     # Catch-all error boundary
│   └── layout.js           # Root layout
├── lib/
│   ├── auth/               # Stateless Auth Utilities
│   │   ├── tokens.js       # JWT generation/verification
│   │   ├── password.js     # Bcrypt hashing
│   │   └── cookies.js      # Strict cookie serialization
│   ├── db/
│   │   ├── index.js        # Cached Mongoose connection
│   │   └── models/         # Mongoose Schemas (Single source of truth)
│   ├── rbac/
│   │   ├── permissions.js  # Role Matrix definition
│   │   └── guards.js       # API-level permission checkers
│   ├── security/
│   │   ├── rate-limit.js   # DB-based Token Bucket limiter
│   │   └── sanitization.js # Input cleaning
│   └── utils/
│   │   ├── api-response.js # Standardized JSend-like responses
│   │   └── logger.js       # Structured logging (NO PII)
├── middleware.js           # Edge-compatible Auth & RBAC Checks
└── .env.local              # Secrets (Non-committed)
```

## 2. Authentication Flow (Stateless & Secure)

1.  **Login**:
    *   **Input**: Email + Password
    *   **Verify**: Find user -> `bcrypt.compare(password, hash)`
    *   **Issue**:
        *   `accessToken`: Expires 15m (Payload: `userId`, `role`, `clinicId`) -> `Authorization` Header (Client-side memory) or Short-lived Cookie. *Decision: HttpOnly Cookie for security against XSS.*
        *   `refreshToken`: Expires 7d (Rotated on use) -> `HttpOnly` Cookie path=`/api/auth/refresh`.
2.  **Request Authorization**:
    *   **Middleware**: Intercepts request -> Decrypts Access Token.
    *   **On Fail**: Returns `401 Unauthorized` (Client triggers silent refresh).
3.  **Logout**:
    *   Clears cookies.
    *   (Optional) Blacklists current refresh token in DB.

## 3. Role-Based Access Control (RBAC) Strategy

We define **Hard Boundaries** at the Application Layer, unrelated to UI.

**Role Hierarchy:**
*   `SYSTEM_ADMIN` (Superuser - Dev/Support only)
*   `CLINIC_ADMIN` (Owner)
*   `DOCTOR`
*   `RECEPTIONIST`

**Enforcement Points:**
1.  **Middleware level**: Route groups (e.g., `/admin` is locked to `CLINIC_ADMIN`).
2.  **API Handler level**:
    ```javascript
    // Example wrapper
    export async function POST(req) {
      const session = await secureRoute(req, { roles: ['DOCTOR'] });
      // Logic...
    }
    ```
3.  **Database Level (Multi-tenant Isolation)**:
    *   Every query **MUST** allow pass `clinicId`.
    *   `MongoosePlugin` will be created to auto-inject `clinicId` into queries based on the context, preventing accidental cross-clinic leaks.

## 4. Rate Limiting Strategy (Clustering-Safe)

Since we cannot rely on local memory (for horizontal scaling), we will use **MongoDB-based Rate Limiting**.

*   **Collection**: `rate_limits`
*   **Key**: `IP_ADDRESS` + `ROUTE_PATH`
*   **Algorithm**: Sliding Window counter.
*   **Limits**:
    *   Auth Routes: 5 req / 15 min (Strict anti-brute force).
    *   Read Routes: 300 req / min.
    *   Write Routes: 60 req / min.

## 5. Data Import/Export Architecture

**Import (Transaction-Safe)**:
1.  **Upload**: Stream file to server (Memory-safe).
2.  **Validation**: `zod` schema check row-by-row.
3.  **Dry Run**: Return errors to UI without saving.
4.  **Execution**: `mongoose.startSession()` -> `withTransaction`.
    *   Insert all records.
    *   If ANY fail -> `abortTransaction` -> Clean slate.

**Export (Audit-Safe)**:
1.  Check `CLINIC_ADMIN` role.
2.  Accept query filters (date range).
3.  Log event: `AuditLog.create({ action: 'EXPORT', actor: userId })`.
4.  Stream MongoDB cursor -> CSV Transformer -> HTTP Response (Avoids loading 10k records into RAM).
