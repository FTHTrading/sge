import { Globe2, Users, Award, TrendingUp, MapPin } from "lucide-react";
import Link from "next/link";

const partnerTiers = [
  {
    tier: "Platinum",
    color: "from-white/20 to-white/5",
    borderColor: "border-white/20",
    count: 12,
    description: "Global-scale deployment partners with 100+ MW capacity and full governance rights.",
  },
  {
    tier: "Gold",
    color: "from-amber-400/10 to-amber-400/5",
    borderColor: "border-amber-400/20",
    count: 34,
    description: "Regional deployment partners with 10-100 MW capacity and voting participation.",
  },
  {
    tier: "Silver",
    color: "from-gray-400/10 to-gray-400/5",
    borderColor: "border-gray-400/20",
    count: 58,
    description: "Local deployment partners with emerging capacity and observer governance status.",
  },
  {
    tier: "Bronze",
    color: "from-amber-700/10 to-amber-700/5",
    borderColor: "border-amber-700/20",
    count: 76,
    description: "New ecosystem members building capacity with mentorship and training access.",
  },
];

const regions = [
  { name: "Africa", countries: 14, mw: "620+" },
  { name: "Asia Pacific", countries: 11, mw: "480+" },
  { name: "Europe", countries: 9, mw: "520+" },
  { name: "Americas", countries: 8, mw: "440+" },
  { name: "Middle East", countries: 5, mw: "340+" },
];

export default function EcosystemPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Ecosystem</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              A Global Network for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                Climate Action
              </span>
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              180+ partners across 47 countries deploying, governing, and
              certifying scalable green energy infrastructure through the SGE
              Alignment OS.
            </p>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="border-y border-white/[0.06] bg-white/[0.01]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <Users className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">180+</p>
              <p className="text-sm text-white/40">Active Partners</p>
            </div>
            <div>
              <Globe2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">47</p>
              <p className="text-sm text-white/40">Countries</p>
            </div>
            <div>
              <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">2,400+</p>
              <p className="text-sm text-white/40">MW Deployed</p>
            </div>
            <div>
              <Award className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">340+</p>
              <p className="text-sm text-white/40">Certifications</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Tiers */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Partner Tiers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {partnerTiers.map((pt) => (
              <div
                key={pt.tier}
                className={`rounded-2xl border ${pt.borderColor} bg-gradient-to-b ${pt.color} p-6`}
              >
                <h3 className="text-lg font-bold text-white">{pt.tier}</h3>
                <p className="text-3xl font-bold text-white mt-2">{pt.count}</p>
                <p className="text-xs text-white/30 mt-1">partners</p>
                <p className="text-sm text-white/40 mt-4 leading-relaxed">{pt.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regional Breakdown */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Regional Presence</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {regions.map((region) => (
              <div
                key={region.name}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-5 text-center"
              >
                <MapPin className="h-5 w-5 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-white">{region.name}</h3>
                <p className="text-2xl font-bold text-white mt-2">{region.countries}</p>
                <p className="text-xs text-white/30">countries</p>
                <p className="text-xs text-emerald-400/70 mt-2">{region.mw} MW</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Join the Ecosystem?
          </h2>
          <p className="text-white/40 max-w-md mx-auto mb-8">
            Become a partner and gain access to governance, standards
            certification, and the global deployment network.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Apply for Partnership
          </Link>
        </div>
      </section>
    </div>
  );
}
