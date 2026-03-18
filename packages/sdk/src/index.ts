// ─────────────────────────────────────────────
// SGE Alignment OS – Public SDK Skeleton
// ─────────────────────────────────────────────

export class SGEClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: { baseUrl: string; apiKey?: string }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`SGE API error ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  // Standards
  async listStandards(params?: { page?: number; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/standards?${query}`);
  }

  async getStandard(id: string) {
    return this.request(`/api/standards/${id}`);
  }

  // Projects
  async listProjects(params?: { page?: number; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/projects?${query}`);
  }

  async getProject(id: string) {
    return this.request(`/api/projects/${id}`);
  }

  // Certifications
  async listCertifications(params?: { page?: number; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/certifications?${query}`);
  }

  // Governance
  async listProposals(params?: { page?: number; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/governance/proposals?${query}`);
  }

  // Audit
  async getAuditEvents(params?: { entityType?: string; entityId?: string; page?: number }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return this.request(`/api/audit?${query}`);
  }

  async verifyAuditChain() {
    return this.request(`/api/audit/verify`);
  }
}

export default SGEClient;
