import { Award, CheckCircle, FileText, Shield, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

const certTypes = [
  {
    icon: Shield,
    title: "Deployment Certification",
    description: "Verify that energy deployments meet SGE performance, safety, and emissions standards through documented evidence and third-party review.",
    badge: "Core",
  },
  {
    icon: FileText,
    title: "Standards Compliance",
    description: "Certify that organizational practices align with published SGE sustainability standards across operations, supply chain, and reporting.",
    badge: "Core",
  },
  {
    icon: Users,
    title: "Partner Certification",
    description: "Validate partner organizations against SGE governance requirements, financial transparency, and community engagement criteria.",
    badge: "Partner",
  },
  {
    icon: Award,
    title: "Researcher Attestation",
    description: "Provide cryptographically-signed attestations for research findings, impact studies, and third-party audits submitted to the platform.",
    badge: "Research",
  },
];

const steps = [
  { number: "01", title: "Submit Evidence", description: "Upload documentation, reports, and proof of compliance through the secure submission portal." },
  { number: "02", title: "Automated Review", description: "AI-assisted checks validate completeness and flag gaps for human review." },
  { number: "03", title: "Expert Review", description: "Assigned certifiers evaluate evidence against the relevant standard criteria." },
  { number: "04", title: "Certification Issued", description: "Approved certifications are recorded on-chain with immutable audit trails." },
];

export default function CertificationPublicPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-emerald-400">Certification Framework</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white max-w-3xl leading-tight mb-6">
            Independent <span className="text-emerald-400">Certification</span> You Can Trust
          </h1>
          <p className="text-lg text-white/50 max-w-2xl mb-8">
            Every SGE certification is backed by cryptographic proofs, third-party review, and permanent immutable records. No shortcuts. No ambiguity.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
          >
            Get Certified
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Cert Types */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <h2 className="text-2xl font-bold text-white mb-8">Certification Types</h2>
        <div className="grid sm:grid-cols-2 gap-5 mb-16">
          {certTypes.map((cert) => {
            const Icon = cert.icon;
            return (
              <div key={cert.title} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{cert.title}</h3>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-600/10 px-2 py-0.5 rounded-full">
                        {cert.badge}
                      </span>
                    </div>
                    <p className="text-sm text-white/50">{cert.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Process */}
        <h2 className="text-2xl font-bold text-white mb-8">Certification Process</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <div key={step.number} className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 -right-2.5 z-10">
                  <ArrowRight className="h-4 w-4 text-white/20" />
                </div>
              )}
              <span className="text-3xl font-bold text-emerald-500/20 mb-3 block">{step.number}</span>
              <h3 className="font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-white/40">{step.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-emerald-500/20 bg-emerald-600/5 p-10 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-3">Ready to get certified?</h3>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">
            Join our growing network of certified partners and demonstrate your commitment to transparent, verifiable sustainability.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Apply for Membership
            </Link>
            <Link
              href="/standards-public"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-6 py-3 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              View Standards
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
