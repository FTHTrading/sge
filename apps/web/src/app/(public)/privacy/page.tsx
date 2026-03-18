export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-400">Legal</span>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Privacy Policy</h1>
        <p className="text-sm text-white/30">Last updated: March 2026</p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-white/60 [&_h2]:text-white [&_h2]:font-semibold [&_h2]:text-lg [&_h2]:mt-8 [&_h2]:mb-3 [&_strong]:text-white/80">

        <p>SGE Foundation (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use the SGE Alignment OS platform.</p>

        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, such as when you create an account, submit a certification application, or contact us for support. This includes:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Name, email address, and organization details</li>
          <li>Blockchain wallet addresses used for governance participation</li>
          <li>Project and deployment data you submit to the platform</li>
          <li>Communications you send us</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide, maintain, and improve the SGE Alignment OS platform</li>
          <li>Process certification applications and governance proposals</li>
          <li>Send technical notices, updates, and support messages</li>
          <li>Generate immutable audit records as required by platform governance</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>We do not sell or rent your personal information to third parties. We may share your information with:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Platform participants</strong> — certain profile and organizational data is visible to verified ecosystem participants as part of the transparency framework</li>
          <li><strong>Service providers</strong> — third parties who assist in platform operations, bound by confidentiality obligations</li>
          <li><strong>On-chain records</strong> — governance votes, certifications, and audit hashes are permanently recorded on public blockchain infrastructure</li>
          <li><strong>Legal requirements</strong> — when required by law or to protect the rights of the Foundation</li>
        </ul>

        <h2>4. Data Retention</h2>
        <p>We retain your personal information for as long as your account is active or as needed to provide services. Blockchain-anchored records are permanent by design and cannot be deleted from public ledgers.</p>

        <h2>5. Security</h2>
        <p>We implement industry-standard security measures including encryption in transit and at rest, role-based access controls, and hash-chained audit infrastructure. Despite these measures, no system is 100% secure.</p>

        <h2>6. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have rights to access, correct, or request deletion of your personal data. Contact us at <a href="mailto:privacy@sgefoundation.org" className="text-emerald-400 hover:text-emerald-300">privacy@sgefoundation.org</a> to exercise these rights.</p>

        <h2>7. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes by email or through the platform dashboard.</p>

        <h2>8. Contact</h2>
        <p>For questions about this Privacy Policy, contact us at <a href="mailto:privacy@sgefoundation.org" className="text-emerald-400 hover:text-emerald-300">privacy@sgefoundation.org</a>.</p>
      </div>
    </div>
  );
}
