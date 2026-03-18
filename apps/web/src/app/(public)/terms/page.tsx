export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-400">Legal</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Terms of Service</h1>
        <p className="text-sm text-white/30">Last updated: March 2026</p>
      </div>

      <div className="space-y-8 text-white/60 text-sm leading-relaxed [&_h2]:text-white [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-white/80">

        <p>By accessing or using the SGE Alignment OS platform, you agree to be bound by these Terms of Service. Please read them carefully before using the platform.</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By creating an account or using any part of the SGE platform, you accept these terms in full. If you disagree with any part of these terms, you may not use the platform.</p>

        <h2>2. Eligibility</h2>
        <p>The platform is intended for use by organizations and professionals operating in the energy, sustainability, research, and governance sectors. By registering, you represent that you have the authority to bind your organization to these terms.</p>

        <h2>3. Platform Use</h2>
        <p>You agree to use the platform only for lawful purposes and in accordance with these Terms. You must not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Submit false or misleading certification evidence</li>
          <li>Attempt to manipulate governance votes or proposals</li>
          <li>Interfere with the platform&apos;s infrastructure or security</li>
          <li>Sublicense, sell, or commercially exploit platform access without authorization</li>
          <li>Violate any applicable laws or regulations</li>
        </ul>

        <h2>4. Intellectual Property</h2>
        <p>The SGE platform, its standards, algorithms, and branding are the intellectual property of SGE Foundation. Partner data and certifications submitted by users remain the property of the submitting organization, subject to the transparency and audit requirements of the platform.</p>

        <h2>5. Blockchain Records</h2>
        <p>You acknowledge that certain actions on the platform — including governance votes, certification approvals, and milestone verifications — create permanent, immutable records on public blockchain infrastructure. These records cannot be deleted or modified once confirmed.</p>

        <h2>6. Disclaimers</h2>
        <p>The platform is provided &quot;as is&quot; without warranty of any kind. SGE Foundation does not guarantee uninterrupted availability or the accuracy of third-party data integrated into the platform. <strong>Nothing on this platform constitutes financial or investment advice.</strong></p>

        <h2>7. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, SGE Foundation shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including losses arising from blockchain transaction finality.</p>

        <h2>8. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or abuse the certification or governance systems.</p>

        <h2>9. Governing Law</h2>
        <p>These Terms are governed by the laws of the jurisdiction in which SGE Foundation is incorporated, without regard to conflict-of-law principles.</p>

        <h2>10. Modifications</h2>
        <p>We may update these Terms from time to time. Continued use of the platform after updates constitutes acceptance of the revised Terms. Material changes will be communicated via the platform dashboard.</p>

        <h2>11. Contact</h2>
        <p>Questions regarding these Terms should be directed to <a href="mailto:legal@sgefoundation.org" className="text-emerald-400 hover:text-emerald-300">legal@sgefoundation.org</a>.</p>
      </div>
    </div>
  );
}
