import Link from "next/link";
import { Zap } from "lucide-react";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { label: "Technology", href: "/technology" },
      { label: "Standards", href: "/standards-public" },
      { label: "Certification", href: "/certification-public" },
      { label: "Research", href: "/research" },
    ],
  },
  {
    title: "Ecosystem",
    links: [
      { label: "Partners", href: "/ecosystem" },
      { label: "Governance", href: "/governance-public" },
      { label: "Documentation", href: "/docs" },
      { label: "Open Framework", href: "/open-framework" },
    ],
  },
  {
    title: "Foundation",
    links: [
      { label: "Mission", href: "/mission" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[hsl(220,16%,3%)]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Link href="/home" className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">SGE</span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              Building resilient climate infrastructure through AI-powered energy
              solutions and transparent governance.
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 hover:text-white/80 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} SGE Foundation. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              TRANSPARENT
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              SECURE
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              IMMUTABLE
            </span>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-white/20 leading-relaxed max-w-3xl">
          Disclaimer: This platform is provided for informational and utility
          purposes. Engagement involves inherent technical and network risks.
          We do not provide financial advice. All blockchain transactions are
          final and irreversible.
        </p>
      </div>
    </footer>
  );
}
