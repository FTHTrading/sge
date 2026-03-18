"use client";

import { Mail, MapPin, Globe2, Send } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400">Contact</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg text-white/50 leading-relaxed">
              Interested in partnering, deploying, or contributing to the SGE
              Alignment OS? Reach out and our team will respond within 48 hours.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24 lg:pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
                <Mail className="h-5 w-5 text-emerald-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">Email</h3>
                <p className="text-sm text-white/40">partnerships@sge.foundation</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
                <MapPin className="h-5 w-5 text-emerald-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">Headquarters</h3>
                <p className="text-sm text-white/40">Global Operations — Distributed</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
                <Globe2 className="h-5 w-5 text-emerald-400 mb-3" />
                <h3 className="text-sm font-semibold text-white mb-1">Website</h3>
                <p className="text-sm text-white/40">sge.foundation</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="h-12 w-12 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                      <Send className="h-5 w-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Message Sent</h3>
                    <p className="text-sm text-white/40">
                      Thank you for reaching out. Our team will review your inquiry and respond within 48 hours.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitted(true);
                    }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/50 mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">
                        Organization
                      </label>
                      <input
                        type="text"
                        className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
                        placeholder="Company or organization"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">
                        Interest
                      </label>
                      <select className="h-10 w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 text-sm text-white focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20">
                        <option value="">Select your interest</option>
                        <option value="partnership">Partnership</option>
                        <option value="deployment">Deployment Support</option>
                        <option value="certification">Standards & Certification</option>
                        <option value="governance">Governance Participation</option>
                        <option value="research">Research Collaboration</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">
                        Message
                      </label>
                      <textarea
                        rows={5}
                        required
                        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 resize-none"
                        placeholder="Tell us about your goals and how we can collaborate..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
