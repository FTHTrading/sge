"use client";

import { useState, useEffect } from "react";
import { internalWallet } from "@/lib/web3/localWallet";
import {
  Key,
  Shield,
  AlertTriangle,
  RefreshCw,
  Download,
  Lock,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Trash2,
  Wallet as WalletIcon
} from "lucide-react";
import { ethers } from "ethers";

export default function LocalWalletPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  
  // Sensitive states (only shown temporarily on gen/import)
  const [activeMnemonic, setActiveMnemonic] = useState<string | null>(null);
  const [activePrivateKey, setActivePrivateKey] = useState<string | null>(null);
  const [showSensitive, setShowSensitive] = useState(false);

  const [importInput, setImportInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state initially
  useEffect(() => {
    syncWalletState();
  }, []);

  const syncWalletState = async () => {
    try {
      const addr = internalWallet.getAddress();
      setAddress(addr);
      
      if (addr) {
        setLoading(true);
        const bal = await internalWallet.getBalance();
        setBalance(ethers.formatEther(bal));
      } else {
        setBalance(null);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch balance. Check your RPC connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (confirm("Generate a new wallet? If you have an existing one loaded, its keys will be wiped from memory.")) {
      try {
        setError(null);
        const nw = internalWallet.generateNewWallet();
        setActiveMnemonic(nw.mnemonic || null);
        setActivePrivateKey(nw.privateKey || null);
        setShowSensitive(true); // show by default so user can copy
        syncWalletState();
      } catch (err: any) {
        setError(err.message || "Failed to generate wallet");
      }
    }
  };

  const handleImport = () => {
    if (!importInput.trim()) {
      setError("Please paste a mnemonic block or private key");
      return;
    }
    try {
      setError(null);
      // extremely basic check (12/24 words vs hex key)
      if (importInput.includes(" ")) {
        internalWallet.importFromPhrase(importInput.trim());
      } else {
        internalWallet.importFromPrivateKey(importInput.trim());
      }
      
      setImportInput("");
      setActiveMnemonic(null);
      setActivePrivateKey(null);
      setShowSensitive(false);
      
      syncWalletState();
    } catch (err: any) {
      setError("Invalid mnemonic or private key format");
    }
  };

  const handleLock = () => {
    if (confirm("Destroy current wallet session? The keys will be wiped from application memory.")) {
      internalWallet.lock();
      setActiveMnemonic(null);
      setActivePrivateKey(null);
      setShowSensitive(false);
      syncWalletState();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Key className="w-6 h-6 text-emerald-400" />
          Internal Local Signer
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Zero-telemetry runtime wallet. Keys live only in your active browser RAM sequence.
          Bypasses all extension middleware.
        </p>
      </div>

      {/* Extreme Warning */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-6 py-4 flex items-start gap-4">
        <Shield className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-white/80 space-y-2">
          <p>
            <strong className="text-red-400">HOT WALLET SESSION:</strong> This module manages
            cryptographic operations entirely in your local browser memory to ensure network privacy.
          </p>
          <ul className="list-disc pl-4 text-white/50 space-y-1 text-xs">
            <li>Refreshing the page will completely destroy the loaded keys.</li>
            <li>Do not use this environment to store large value assets long-term.</li>
            <li>No extensions (MetaMask, etc) can see or intercept the transactions signed here.</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Main Status Panel */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <WalletIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Active Session</h2>
          </div>
          {address && (
            <button
              onClick={handleLock}
              className="flex items-center gap-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Destroy Session
            </button>
          )}
        </div>

        <div className="p-6 text-sm">
          {!address ? (
            <div className="text-white/40 flex flex-col items-center justify-center py-6 text-center">
              <Lock className="w-12 h-12 mb-3 text-white/10" />
              <p>No wallet is currently loaded into memory.</p>
              <p className="text-xs mt-1">Generate or import one below.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-white/40">Address</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-emerald-400 font-medium">{address}</span>
                  <button onClick={() => copyToClipboard(address, "address")} className="text-white/30 hover:text-white">
                    {copied === "address" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-white/40">Native Balance</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-white">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : `${balance} ETH`}
                  </span>
                  <button onClick={syncWalletState} className="text-emerald-400/50 hover:text-emerald-400" title="Refresh">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                <span className="text-white/40">Network RPC</span>
                <span className="font-mono text-white/60">eth.llamarpc.com (Chain ID 1)</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Transaction Builder (Only active when wallet is loaded) */}
      {address && (
        <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] overflow-hidden mt-6">
          <div className="px-6 py-4 border-b border-emerald-500/10 flex items-center gap-3 bg-emerald-500/5">
            <h2 className="text-sm font-semibold text-emerald-400">Execute Transaction</h2>
            <span className="text-xs text-emerald-400/50 flex-1">Offline signing via direct RPC</span>
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-2 text-sm text-white/60">
              <p>To fund the SGE claim contract, you can send SGE tokens to the claim address.</p>
              <p className="font-mono text-emerald-400/80 p-2 bg-black/40 rounded">Contract: 0x...</p>
              <p>Or use the generalized transaction builder below for any token or contract call.</p>
            </div>
            {/* Minimal Tx Builder UI */}
            <div className="grid gap-4 mt-6">
              <div>
                <label className="text-xs text-white/40 block mb-1">To Address</label>
                <input type="text" placeholder="0x..." className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Value (ETH)</label>
                <input type="text" placeholder="0.0" className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Hex Data (Optional)</label>
                <input type="text" placeholder="0x..." className="w-full bg-black/40 border border-white/[0.06] rounded-lg px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              <button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg px-6 py-2 transition-colors mt-2 text-sm w-fit">
                Sign & Broadcast Transaction
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Sensitive Material Viewer (Only shown exactly after generate) */}
      {(activeMnemonic || activePrivateKey) && address && (
        <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="px-6 py-4 border-b border-amber-500/10 flex items-center justify-between">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-sm font-bold">Backup Required Immediately</h2>
            </div>
            <button
              onClick={() => setShowSensitive(!showSensitive)}
              className="text-amber-400/60 hover:text-amber-400 flex items-center gap-2 text-xs font-medium"
            >
              {showSensitive ? <><EyeOff className="w-4 h-4"/> Hide Details</> : <><Eye className="w-4 h-4"/> Show Details</>}
            </button>
          </div>
          
          {showSensitive && (
            <div className="p-6 space-y-6">
              <p className="text-xs text-amber-400/80 mb-4">
                This material is currently only in your local browser memory. When you reload or navigate away, it will be gone permanently. Copy it securely now.
              </p>
              
              {activeMnemonic && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-200">12-Word Recovery Phrase</span>
                    <button onClick={() => copyToClipboard(activeMnemonic, "phrase")} className="text-amber-400/60 hover:text-amber-400 text-xs flex items-center gap-1">
                       {copied === "phrase" ? "Copied!" : <><Copy className="w-3 h-3"/> Copy</>}
                    </button>
                  </div>
                  <div className="font-mono text-sm tracking-wide text-white bg-black/40 p-4 rounded-lg border border-amber-500/20 select-all leading-relaxed break-words">
                    {activeMnemonic}
                  </div>
                </div>
              )}

              {activePrivateKey && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-200">Private Key Hex</span>
                    <button onClick={() => copyToClipboard(activePrivateKey, "pk")} className="text-amber-400/60 hover:text-amber-400 text-xs flex items-center gap-1">
                      {copied === "pk" ? "Copied!" : <><Copy className="w-3 h-3"/> Copy</>}
                    </button>
                  </div>
                  <div className="font-mono text-xs tracking-wide text-white/70 bg-black/40 p-3 rounded-lg border border-amber-500/20 break-all select-all">
                    {activePrivateKey}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Generation & Import Controls */}
      {!address && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Generate */}
          <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">Generate Fresh Session</h2>
            </div>
            <p className="text-xs text-white/40 mb-6 flex-1">
              Create a brand new wallet securely in memory. Math is done completely offline using ethers.js. 
              The private key is never sent to any server.
            </p>
            <button
              onClick={handleGenerate}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
            >
              Generate New Wallet
            </button>
          </section>

          {/* Import */}
          <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <Download className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Import Existing</h2>
            </div>
            <p className="text-xs text-white/40 mb-4">
              Paste a 12/24 word Mnemonic or a 64-character raw hex Private Key.
            </p>
            <textarea
              className="w-full h-20 mb-4 bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white font-mono placeholder:text-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. apple piano abandon..."
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
            />
            <button
              onClick={handleImport}
              className="w-full py-2.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-sm font-medium transition border border-blue-500/20"
            >
              Load into Memory
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
