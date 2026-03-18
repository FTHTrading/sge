"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Building2, Globe2, CheckCircle, ChevronRight } from "lucide-react";

const orgTypes = [
  "Enterprise",
  "Research Institution",
  "Government Agency",
  "NGO / Non-Profit",
  "Energy Operator",
  "Technology Vendor",
];

const tiers = [
  {
    name: "Associate",
    description: "Entry-level participation. Access to public standards and governance proposals.",
    features: ["Standards access", "Governance visibility", "Network directory listing"],
  },
  {
    name: "Standard",
    description: "Full platform access with project registration and certification pipeline.",
    features: ["All Associate benefits", "Project registration", "Certification access", "Milestone tracking"],
  },
  {
    name: "Premier",
    description: "Priority support, custom integrations, and co-governance rights.",
    features: ["All Standard benefits", "Priority processing", "API integrations", "Co-governance rights"],
  },
];

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    orgName: "",
    orgType: "",
    country: "",
    website: "",
    contactName: "",
    email: "",
    tier: "Standard",
    description: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 py-24">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Application Submitted</h2>
          <p className="text-white/50 mb-8">
            Thank you for applying to the SGE Ecosystem. Our team will review your application and respond within 5–7 business days.
          </p>
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">Join the Ecosystem</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white max-w-2xl leading-tight mb-4">
            Apply to Join the <span className="text-emerald-400">SGE Ecosystem</span>
          </h1>
          <p className="text-lg text-white/50 max-w-xl">
            Become a verified partner to access certifications, governance, and the global SGE network.
          </p>
        </div>
      </section>

      {/* Partnership Tiers */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-xl font-semibold text-white mb-6">Choose your partnership tier</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {tiers.map((tier) => (
            <button
              key={tier.name}
              onClick={() => handleChange("tier", tier.name)}
              className={`text-left rounded-xl border p-5 transition-all ${
                form.tier === tier.name
                  ? "border-emerald-500/40 bg-emerald-600/5 ring-1 ring-emerald-500/20"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">{tier.name}</span>
                {form.tier === tier.name && (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                )}
              </div>
              <p className="text-xs text-white/40 mb-3">{tier.description}</p>
              <ul className="space-y-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Application Form */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 max-w-2xl">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />
            Organization Details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={form.orgName}
                  onChange={(e) => handleChange("orgName", e.target.value)}
                  placeholder="Acme Energy Corp"
                  className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Organization Type *</label>
                <select
                  required
                  value={form.orgType}
                  onChange={(e) => handleChange("orgType", e.target.value)}
                  className="w-full h-11 rounded-lg border border-white/[0.08] bg-[hsl(220,16%,7%)] px-4 text-sm text-white focus:border-emerald-500/40 focus:outline-none transition-colors"
                >
                  <option value="">Select type…</option>
                  {orgTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Country *</label>
                <input
                  type="text"
                  required
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  placeholder="United States"
                  className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Primary Contact Name *</label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) => handleChange("contactName", e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full h-11 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-2">Tell us about your organization</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe your organization's mission, energy projects, and how you plan to engage with the SGE ecosystem…"
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-emerald-500/40 focus:outline-none transition-colors resize-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
            >
              Submit Application
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
