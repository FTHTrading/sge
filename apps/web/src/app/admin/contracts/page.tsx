"use client";

import { useEffect, useState } from "react";
import {
  FileCode,
  Coins,
  Globe2,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Settings2,
} from "lucide-react";

interface Network {
  id: string;
  name: string;
  chainId: number;
  explorerUrl: string | null;
  isActive: boolean;
}

interface TokenContract {
  id: string;
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isSupported: boolean;
}

interface ClaimContract {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
  notes: string | null;
}

interface ClaimRule {
  id: string;
  tokenSymbol: string;
  claimAmountHuman: number;
  isActive: boolean;
  totalClaimed: number;
  maxClaims: number | null;
  description: string | null;
}

interface ContractData {
  networks: Network[];
  tokens: TokenContract[];
  contracts: ClaimContract[];
  rules: ClaimRule[];
}

export default function AdminContractsPage() {
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/contracts")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contract Configuration</h1>
          <p className="text-sm text-white/40 mt-1">
            Manage blockchain networks, token contracts, and claim rules.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-sm text-white/40 hover:text-white hover:bg-white/5 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      ) : !data ? (
        <div className="text-center py-20 text-white/30">
          Failed to load contract data. Create an API route at <code>/api/admin/contracts</code>.
        </div>
      ) : (
        <>
          {/* Networks */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
              <Globe2 className="w-4 h-4" /> Networks
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {data.networks.map((net) => (
                <div key={net.id} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-white">{net.name}</span>
                    {net.isActive ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="text-xs text-white/30">Chain ID: {net.chainId}</div>
                  {net.explorerUrl && (
                    <a
                      href={net.explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-400/60 hover:text-emerald-400 mt-1 transition"
                    >
                      Explorer <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Token Contracts */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
              <Coins className="w-4 h-4" /> Token Contracts
            </h2>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs text-white/30 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Symbol</th>
                    <th className="text-left px-6 py-3">Name</th>
                    <th className="text-left px-6 py-3">Address</th>
                    <th className="text-center px-6 py-3">Decimals</th>
                    <th className="text-center px-6 py-3">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.tokens.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 font-medium text-white">{t.symbol}</td>
                      <td className="px-6 py-4 text-white/60">{t.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-white/40">
                        <a
                          href={`https://etherscan.io/token/${t.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-400 transition"
                        >
                          {t.address.slice(0, 10)}…{t.address.slice(-6)}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-center text-white/40">{t.decimals}</td>
                      <td className="px-6 py-4 text-center">
                        {t.isSupported ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Claim Contracts */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
              <FileCode className="w-4 h-4" /> Claim Contracts
            </h2>
            <div className="space-y-4">
              {data.contracts.map((c) => (
                <div key={c.id} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">{c.name}</span>
                      {c.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    <Settings2 className="w-4 h-4 text-white/20" />
                  </div>
                  <div className="font-mono text-xs text-white/30 mb-2">
                    <a
                      href={`https://etherscan.io/address/${c.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-emerald-400 transition"
                    >
                      {c.address} <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </div>
                  {c.notes && <div className="text-xs text-white/20">{c.notes}</div>}
                </div>
              ))}
            </div>
          </section>

          {/* Claim Rules */}
          <section>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
              <Settings2 className="w-4 h-4" /> Claim Rules
            </h2>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs text-white/30 uppercase tracking-wider">
                    <th className="text-left px-6 py-3">Token</th>
                    <th className="text-right px-6 py-3">Amount</th>
                    <th className="text-right px-6 py-3">Total Claimed</th>
                    <th className="text-right px-6 py-3">Max Claims</th>
                    <th className="text-left px-6 py-3">Description</th>
                    <th className="text-center px-6 py-3">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.rules.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-6 py-4 font-medium text-white">{r.tokenSymbol}</td>
                      <td className="px-6 py-4 text-right text-white/60">{r.claimAmountHuman}</td>
                      <td className="px-6 py-4 text-right text-white/60">{r.totalClaimed}</td>
                      <td className="px-6 py-4 text-right text-white/40">{r.maxClaims ?? "∞"}</td>
                      <td className="px-6 py-4 text-white/30 text-xs">{r.description ?? "—"}</td>
                      <td className="px-6 py-4 text-center">
                        {r.isActive ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
