import { BookOpen, Code2, FileText, Terminal, ChevronRight, ArrowRight, Zap, Shield, Scale } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    icon: Zap,
    title: "Getting Started",
    description: "Set up your partner account, generate API keys, and make your first authenticated request in under 10 minutes.",
    links: [
      { label: "Quick Start Guide", href: "#quickstart" },
      { label: "Authentication", href: "#auth" },
      { label: "SDK Installation", href: "#sdk" },
    ],
    badge: "Start Here",
  },
  {
    icon: Code2,
    title: "API Reference",
    description: "Full REST API documentation covering all endpoints, request schemas, response formats, and error codes.",
    links: [
      { label: "Deployments API", href: "#deployments-api" },
      { label: "Certifications API", href: "#certifications-api" },
      { label: "Governance API", href: "#governance-api" },
    ],
    badge: "Reference",
  },
  {
    icon: Shield,
    title: "Proof & Attestation",
    description: "Submit cryptographic proofs, manage attestation workflows, and integrate on-chain verification into your systems.",
    links: [
      { label: "Proof Submission", href: "#proof-submission" },
      { label: "Attestation Schemas", href: "#schemas" },
      { label: "Verification Endpoints", href: "#verification" },
    ],
    badge: "Core",
  },
  {
    icon: Scale,
    title: "Governance Integration",
    description: "Participate in on-chain governance, submit proposals, and integrate voting mechanisms into partner dashboards.",
    links: [
      { label: "Proposal Lifecycle", href: "#proposals" },
      { label: "Voting API", href: "#voting" },
      { label: "Governance Webhooks", href: "#webhooks" },
    ],
    badge: "Governance",
  },
  {
    icon: FileText,
    title: "Standards & Schemas",
    description: "Machine-readable standards documents, JSON schemas for compliance reporting, and certification data models.",
    links: [
      { label: "Standards Catalog", href: "#standards" },
      { label: "Report Schemas", href: "#report-schemas" },
      { label: "Changelog", href: "#changelog" },
    ],
    badge: "Standards",
  },
  {
    icon: Terminal,
    title: "CLI & Tooling",
    description: "Command-line tools for automating deployments, running local validation, and integrating SGE into your CI/CD pipelines.",
    links: [
      { label: "CLI Reference", href: "#cli" },
      { label: "CI/CD Integration", href: "#cicd" },
      { label: "Local Validator", href: "#validator" },
    ],
    badge: "Tooling",
  },
];

const quickLinks = [
  { label: "OpenAPI Spec (JSON)", href: "#openapi-json" },
  { label: "OpenAPI Spec (YAML)", href: "#openapi-yaml" },
  { label: "Postman Collection", href: "#postman" },
  { label: "SDK — JavaScript/TypeScript", href: "#sdk-js" },
  { label: "SDK — Python", href: "#sdk-python" },
  { label: "Sandbox Environment", href: "#sandbox" },
];

export default function DocsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">Developer Documentation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
            Build on the <span className="text-emerald-400">SGE Platform</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mb-10">
            Everything you need to integrate with the Smart Grid Energy ecosystem — APIs, SDKs, schemas, and step-by-step guides for every use case.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#quickstart"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
            >
              Quick Start
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#openapi-json"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              <Code2 className="h-4 w-4" />
              API Reference
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Links Bar */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-white/30 mr-3 font-medium">QUICK ACCESS:</span>
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:border-white/[0.12] transition-colors"
              >
                {link.label}
                <ChevronRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-emerald-500/20 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-600/10">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      {section.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed mb-6">{section.description}</p>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="flex items-center gap-2 text-sm text-white/50 hover:text-emerald-400 transition-colors group/link"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover/link:text-emerald-500 transition-colors" />
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Code Example Callout */}
      <section className="py-16 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-white/70">Example Request</span>
              </div>
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-white/10" />
                <span className="h-3 w-3 rounded-full bg-white/10" />
                <span className="h-3 w-3 rounded-full bg-white/10" />
              </div>
            </div>
            <div className="p-6">
              <pre className="text-sm text-white/60 leading-relaxed overflow-x-auto">
                <code>{`curl -X GET https://api.sge.foundation/v1/deployments \\
  -H "Authorization: Bearer <SGE_API_KEY>" \\
  -H "Content-Type: application/json"

# Response
{
  "data": [
    {
      "id": "dep_01HXYZ...",
      "name": "Solar Array Alpha",
      "status": "certified",
      "certified_at": "2025-11-14T09:21:33Z",
      "proof_hash": "0x4f9c..."
    }
  ],
  "meta": { "total": 142, "page": 1 }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Integrate?</h2>
          <p className="text-white/40 max-w-xl mx-auto mb-8">
            Request API access through the partner portal to get your sandbox credentials and begin testing.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Apply for API Access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              Talk to an Engineer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
