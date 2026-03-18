import Link from "next/link";

const sections = [
  {
    title: "Getting Started",
    items: [
      { href: "/docs/quickstart", label: "Quick Start" },
      { href: "/docs/installation", label: "Installation" },
      { href: "/docs/architecture", label: "Architecture Overview" },
    ],
  },
  {
    title: "Core Concepts",
    items: [
      { href: "/docs/partners", label: "Partners & Organizations" },
      { href: "/docs/projects", label: "Projects & Deployments" },
      { href: "/docs/milestones", label: "Milestones & Verification" },
      { href: "/docs/standards", label: "Standards & Certification" },
      { href: "/docs/governance", label: "Governance Framework" },
      { href: "/docs/audit", label: "Audit Chain" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { href: "/docs/api/authentication", label: "Authentication" },
      { href: "/docs/api/partners", label: "Partners API" },
      { href: "/docs/api/projects", label: "Projects API" },
      { href: "/docs/api/deployments", label: "Deployments API" },
      { href: "/docs/api/milestones", label: "Milestones API" },
      { href: "/docs/api/standards", label: "Standards API" },
      { href: "/docs/api/governance", label: "Governance API" },
      { href: "/docs/api/audit", label: "Audit API" },
    ],
  },
  {
    title: "SDK",
    items: [
      { href: "/docs/sdk/overview", label: "SDK Overview" },
      { href: "/docs/sdk/typescript", label: "TypeScript SDK" },
      { href: "/docs/sdk/examples", label: "Examples" },
    ],
  },
];

export default function DocsHome() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
            Documentation
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">
          SGE Alignment OS Docs
        </h1>
        <p className="text-lg text-white/40 max-w-2xl">
          Technical documentation for the Scalable Green Energy Alignment Operating System.
          Learn how to integrate, build, and deploy on the SGE platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((section) => (
          <div key={section.title} className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
            <h2 className="text-sm font-semibold text-white mb-4">{section.title}</h2>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/40 hover:text-emerald-400 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
        <h2 className="text-sm font-semibold text-white mb-2">Quick Install</h2>
        <pre className="rounded-lg bg-black/50 p-4 text-sm text-emerald-400/80 font-mono overflow-x-auto">
{`npm install @sge/sdk
# or
pnpm add @sge/sdk`}
        </pre>
        <pre className="rounded-lg bg-black/50 p-4 text-sm text-white/40 font-mono mt-3 overflow-x-auto">
{`import { SGEClient } from '@sge/sdk';

const sge = new SGEClient({
  apiKey: process.env.SGE_API_KEY,
  environment: 'production',
});

const partners = await sge.partners.list();
console.log(partners);`}
        </pre>
      </div>
    </div>
  );
}
