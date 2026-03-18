import { Wallet, JsonRpcProvider, HDNodeWallet, TransactionRequest } from "ethers";
import { SGE_CONFIG } from "@/lib/config/sge";

/**
 * INTERNAL LOCAL SIGNER
 * 100% isolated key management and transaction signing.
 * Makes ZERO calls to third-party telemetry or wallet servers.
 * Connects ONLY to the designated RPC endpoint.
 */
export class LocalWalletManager {
  private wallet: Wallet | HDNodeWallet | null = null;
  private provider: JsonRpcProvider;

  constructor(rpcUrl: string = "https://eth.llamarpc.com") {
    // We explicitly define the provider to bypass MetaMask/window.ethereum completely.
    this.provider = new JsonRpcProvider(rpcUrl, SGE_CONFIG.chainId, {
      staticNetwork: true, // Prevents unnecessary eth_chainId calls
    });
  }

  /**
   * 1. GENERATE NEW WALLET
   * Fully offline math. Never touches the network.
   */
  public generateNewWallet() {
    this.wallet = Wallet.createRandom().connect(this.provider);
    return {
      address: this.wallet.address,
      mnemonic: this.wallet.mnemonic?.phrase,
      privateKey: this.wallet.privateKey,
    };
  }

  /**
   * 2. IMPORT EXISTING WALLET
   * Fully offline.
   */
  public importFromPhrase(mnemonic: string) {
    this.wallet = Wallet.fromPhrase(mnemonic).connect(this.provider);
    return this.wallet.address;
  }

  public importFromPrivateKey(privateKey: string) {
    this.wallet = new Wallet(privateKey).connect(this.provider);
    return this.wallet.address;
  }

  /**
   * 3. GET STATE
   */
  public getAddress(): string | null {
    return this.wallet ? this.wallet.address : null;
  }

  public async getBalance(): Promise<bigint> {
    if (!this.wallet) throw new Error("Wallet not loaded");
    return await this.provider.getBalance(this.wallet.address);
  }

  /**
   * 4. SIGN AND BROADCAST
   * Signs the TX locally in memory, then pushes the raw hex directly to the RPC.
   */
  public async sendTransaction(tx: TransactionRequest) {
    if (!this.wallet) throw new Error("Wallet not loaded");
    
    // The wallet will sign the transaction locally and send the raw broadcast
    // directly to your RPC provider, bypassing any extensions.
    const response = await this.wallet.sendTransaction(tx);
    return response;
  }

  /**
   * 5. DESTROY CAPABILITY
   * Wipes the key from the class instance (though JS garbage collection means 
   * it isn't a true secure memory wipe like a hardware wallet, it unlinks it).
   */
  public lock() {
    this.wallet = null;
  }
}

// Export a singleton instance for app-wide use
export const internalWallet = new LocalWalletManager();
