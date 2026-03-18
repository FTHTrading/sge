import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Globe2,
  Key,
  Palette,
  Database,
} from "lucide-react";

const settingSections = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your account details, display name, and avatar.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure email, push, and in-app notification preferences.",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Two-factor authentication, session management, and API keys.",
  },
  {
    icon: Key,
    title: "API Access",
    description: "Generate and manage API keys for SDK and third-party integrations.",
  },
  {
    icon: Globe2,
    title: "Organization",
    description: "Update organization details, region, and partner tier information.",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize theme, density, and accessibility preferences.",
  },
  {
    icon: Database,
    title: "Data & Privacy",
    description: "Export your data, manage consent preferences, and delete account.",
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/40 mt-1">
          Manage your account, security, and platform preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {settingSections.map((section) => (
          <button
            key={section.title}
            className="text-left rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6 hover:bg-white/[0.02] hover:border-white/[0.1] transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-white/[0.03] flex items-center justify-center group-hover:bg-emerald-600/10 transition-colors">
                <section.icon className="h-5 w-5 text-white/25 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{section.title}</h3>
                <p className="text-xs text-white/40 mt-1 leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Settings */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Quick Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white/70">Dark Mode</p>
              <p className="text-xs text-white/30">Always enabled for consistency</p>
            </div>
            <div className="h-6 w-10 rounded-full bg-emerald-600 flex items-center justify-end px-0.5">
              <div className="h-5 w-5 rounded-full bg-white" />
            </div>
          </div>
          <div className="border-t border-white/[0.04]" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white/70">Email Notifications</p>
              <p className="text-xs text-white/30">Receive milestone and governance updates</p>
            </div>
            <div className="h-6 w-10 rounded-full bg-emerald-600 flex items-center justify-end px-0.5">
              <div className="h-5 w-5 rounded-full bg-white" />
            </div>
          </div>
          <div className="border-t border-white/[0.04]" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-white/70">Compact Table Density</p>
              <p className="text-xs text-white/30">Reduce spacing in data tables</p>
            </div>
            <div className="h-6 w-10 rounded-full bg-white/[0.1] flex items-center px-0.5">
              <div className="h-5 w-5 rounded-full bg-white/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
