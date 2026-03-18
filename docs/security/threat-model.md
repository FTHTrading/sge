# SGE Platform Threat Model

> [!WARNING]
> This is a living document. As new infrastructure (like Web3 Smart Contract claims) is phased into production, the threat vectors expand. Revisit during all major architectural shifts.

## Core Boundaries and Guarantees
- Unprivileged users cannot view platform endpoints unless standard data is flagged `public`.
- Non-Super Admins cannot forcibly write data without triggering the Audit Ledger.
- Hashes inside the Postgres instance must independently verify. Any mismatch implies DB tampering.

## Threat Matrix

| Threat Vector | Description | Severity | Mitigation Strategy | Residual Risk |
|--------------|-------------|:------:|---------------------|:-------------:|
| **Unauthorized DB Modification** | An attacker gains access to PostgreSQL and alters record states bypassing application logic. | **CRITICAL** | The `packages/audit/` system stores chained hashes. Scheduled jobs verify block integrity. Tampered DB data flags alert instantly. | Low |
| **API Parameter Pollution** | User alters API body data (e.g. `projectId`) trying to access cross-tenant data. | **HIGH** | `packages/core/` services forcibly re-verify user IDs associated with incoming parameters before executing ORM writes. | Low |
| **AI Voice Assistant Prompt Injection** | End-users speak malicious intents trying to make the AI expose internal env variables or system prompts. | **MEDIUM** | Strict system prompt sanitization on `/api/ai/chat`. The AI agent does not have privileged DB read/write runtime capabilities. | Low |
| **Third-Party API Secret Leak** | ElevenLabs or OpenAI keys leak to the client bundle. | **HIGH** | API calls are forced proxy through Next.js server components entirely. Keys do not exist on the client context. | None |
| **Session Hijacking** | Exploiting active JWT/Session states to masquerade as an auditor. | **HIGH** | Hard session expiry bounds tied to IP / Auth providers. High-level tier overrides require MFA (planned). | Medium |

### Operational Security Stance
Our operational baseline is zero trust across all network boundaries. Data flows from Cloudflare to PostgreSQL are encapsulated via private VPN tunnels / encrypted endpoints restricting open internet access wherever possible.
