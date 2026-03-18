# Security Policy

## Supported Versions

Currently, only the main `master` / `main` branch of SGE Alignment OS receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| v1.x.x  | :white_check_mark: |
| < v1.0  | :x:                |

## Reporting a Vulnerability

We take the security of our platform and our partners' data and auditing chains extremely seriously. If you discover a security vulnerability within the SGE Alignment OS, please send an email to **security@sge.foundation**.

> [!CAUTION]
> **Please do NOT report security vulnerabilities via public GitHub issues.**

### What to include in your report:
- The type of vulnerability (e.g., XSS, SQLi, Auth Bypass, Cryptographic weakness).
- A step-by-step process to reproduce the issue.
- The potential impact to the platform, audit chains, or client users.
- Your assessment of the severity.

We will normally acknowledge receipt of the vulnerability report within 24 hours, and coordinate a timeline for patches.

## Security Model Overview

The SGE platform employs multiple layers of deep security:

1. **Role-Based Access Control (RBAC):** All user sessions undergo an 8-level authorization matrix strictly enforcing separation of duties.
2. **Immutable Audit Validation:** Any manipulation of the core domain layers (partners, deployments) hashes an event block to `audit/`. These hashes are cryptographically chained and cannot be retroactively modified without creating a verifiable fork in the chain structure. 
3. **Environment Isolation:** Zero reliance on shared `NEXT_PUBLIC` variables for critical infrastructure. Total masking of AI endpoints (ElevenLabs, OpenAI). 
4. **Dependabot & Snyk:** All upstream ecosystem dependencies are locked securely via `pnpm` and monitored via CI/CD for runtime vulnerabilities.