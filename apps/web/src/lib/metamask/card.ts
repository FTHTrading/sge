// ─────────────────────────────────────────────
// MetaMask Card — Configuration & Support Matrix
// ─────────────────────────────────────────────
// All data here is based on official MetaMask sources:
//   https://metamask.io/card
//   https://portfolio.metamask.io/card
//   https://support.metamask.io/manage-crypto/metamask-card/what-is-metamask-card
//   https://support.metamask.io/manage-crypto/metamask-card/getting-started-with-card
//   https://metamask.io/news/metamask-card-blackbird-dining-benefits
// ─────────────────────────────────────────────

/* ──────────────── TYPES ──────────────── */

export interface SupportedNetwork {
  name: string;
  chainId: number | null; // null for non-EVM chains
  isEVM: boolean;
  status: "supported" | "coming_soon";
}

export interface SupportedToken {
  symbol: string;
  name: string;
  networks: string[]; // network names from supportedNetworks
  status: "supported" | "limited";
}

export interface SupportedRegion {
  region: string;
  status: "available" | "waitlist" | "unavailable";
  tiers: ("virtual" | "metal")[];
  notes?: string;
}

export interface CardPerk {
  title: string;
  description: string;
  partner?: string;
  active: boolean;
  url?: string;
}

/* ──────────────── OFFICIAL URLS ──────────────── */

export const METAMASK_CARD_URLS = {
  info: "https://metamask.io/card",
  portfolio: "https://portfolio.metamask.io/card",
  whatIsCard: "https://support.metamask.io/manage-crypto/metamask-card/what-is-metamask-card",
  gettingStarted: "https://support.metamask.io/manage-crypto/metamask-card/getting-started-with-card",
  blackbird: "https://metamask.io/news/metamask-card-blackbird-dining-benefits",
  downloadMetaMask: "https://metamask.io/download/",
  introducing: "https://metamask.io/news/introducing-metamask-card-upgrade-your-crypto-spending",
} as const;

/* ──────────────── SUPPORTED NETWORKS ──────────────── */

export const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  { name: "Linea", chainId: 59144, isEVM: true, status: "supported" },
  { name: "Base", chainId: 8453, isEVM: true, status: "supported" },
  { name: "Solana", chainId: null, isEVM: false, status: "supported" },
  { name: "Monad", chainId: null, isEVM: true, status: "supported" },
];

/* ──────────────── SUPPORTED TOKENS ──────────────── */

export const SUPPORTED_TOKENS: SupportedToken[] = [
  { symbol: "USDC", name: "USD Coin", networks: ["Linea", "Base", "Solana"], status: "supported" },
  { symbol: "USDT", name: "Tether USD", networks: ["Linea", "Base"], status: "supported" },
  { symbol: "ETH", name: "Ether", networks: ["Linea"], status: "supported" },
  { symbol: "SOL", name: "Solana", networks: ["Solana"], status: "supported" },
];

/* ──────────────── SUPPORTED REGIONS ──────────────── */

export const SUPPORTED_REGIONS: SupportedRegion[] = [
  { region: "United States", status: "available", tiers: ["virtual", "metal"], notes: "Virtual + Metal card available" },
  { region: "European Union / EEA", status: "available", tiers: ["virtual"], notes: "Virtual card, region-specific restrictions may apply" },
  { region: "United Kingdom", status: "available", tiers: ["virtual"] },
  { region: "Canada", status: "waitlist", tiers: [], notes: "Expansion planned" },
  { region: "Australia", status: "waitlist", tiers: [], notes: "Expansion planned" },
  { region: "Other", status: "unavailable", tiers: [], notes: "Check metamask.io/card for latest availability" },
];

/* ──────────────── CARD PERKS ──────────────── */

export const CARD_PERKS: CardPerk[] = [
  {
    title: "Use Anywhere Mastercard Is Accepted",
    description: "Spend crypto at millions of merchants worldwide. Crypto is converted to fiat at the moment of purchase.",
    active: true,
  },
  {
    title: "Blackbird Dining Benefits",
    description: "MetaMask Card holders get exclusive dining benefits through the Blackbird partnership, including special perks at participating restaurants.",
    partner: "Blackbird",
    active: true,
    url: METAMASK_CARD_URLS.blackbird,
  },
  {
    title: "Apple Pay & Google Pay",
    description: "Add your virtual MetaMask Card to Apple Pay or Google Pay for contactless payments.",
    active: true,
  },
  {
    title: "Metal Card (US)",
    description: "US cardholders can upgrade to a premium metal Mastercard.",
    active: true,
  },
  {
    title: "Self-Custody Until Purchase",
    description: "Your funds stay in your wallet until the exact moment you make a purchase — no pre-funding required.",
    active: true,
  },
];

/* ──────────────── ELIGIBILITY CHECK ──────────────── */

export interface CardEligibilityResult {
  isEligible: boolean;
  hasMetaMask: boolean;
  hasCompatibleNetwork: boolean;
  hasCompatibleToken: boolean;
  regionSupported: boolean | null; // null = not checked
  compatibleNetworks: string[];
  compatibleTokens: string[];
  suggestions: string[];
}

/**
 * Check card readiness based on wallet state.
 * This does NOT call MetaMask APIs — it checks local config against user's context.
 */
export function checkCardEligibility(opts: {
  hasMetaMask: boolean;
  connectedChainId: number | null;
  tokenBalances: Record<string, bigint>;
  userRegion?: string;
}): CardEligibilityResult {
  const suggestions: string[] = [];

  // MetaMask check
  if (!opts.hasMetaMask) {
    suggestions.push("Install MetaMask to use MetaMask Card.");
    return {
      isEligible: false,
      hasMetaMask: false,
      hasCompatibleNetwork: false,
      hasCompatibleToken: false,
      regionSupported: null,
      compatibleNetworks: [],
      compatibleTokens: [],
      suggestions,
    };
  }

  // Network check
  const compatibleNetworks = SUPPORTED_NETWORKS.filter(
    (n) => n.isEVM && n.chainId === opts.connectedChainId && n.status === "supported"
  ).map((n) => n.name);

  const hasCompatibleNetwork = compatibleNetworks.length > 0;
  if (!hasCompatibleNetwork) {
    const names = SUPPORTED_NETWORKS.filter((n) => n.status === "supported")
      .map((n) => n.name)
      .join(", ");
    suggestions.push(`Switch to a supported network: ${names}.`);
  }

  // Token check
  const compatibleTokens = SUPPORTED_TOKENS.filter(
    (t) => t.status === "supported" && (opts.tokenBalances[t.symbol] ?? 0n) > 0n
  ).map((t) => t.symbol);

  const hasCompatibleToken = compatibleTokens.length > 0;
  if (!hasCompatibleToken) {
    suggestions.push("Acquire USDC or USDT on a supported network.");
  }

  // Region check
  let regionSupported: boolean | null = null;
  if (opts.userRegion) {
    const region = SUPPORTED_REGIONS.find(
      (r) => r.region.toLowerCase().includes(opts.userRegion!.toLowerCase())
    );
    regionSupported = region?.status === "available" || false;
    if (!regionSupported) {
      suggestions.push("MetaMask Card may not be available in your region yet. Check metamask.io/card for updates.");
    }
  }

  const isEligible = hasCompatibleNetwork && hasCompatibleToken && regionSupported !== false;

  if (isEligible && suggestions.length === 0) {
    suggestions.push("You appear ready for MetaMask Card! Open MetaMask Portfolio to get started.");
  }

  return {
    isEligible,
    hasMetaMask: true,
    hasCompatibleNetwork,
    hasCompatibleToken,
    regionSupported,
    compatibleNetworks,
    compatibleTokens,
    suggestions,
  };
}
