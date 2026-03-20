// ─────────────────────────────────────────────
// SGE Legacy Token — ABI
// ─────────────────────────────────────────────
// Minimal ABI for the deployed legacy SGE token.
// IMPORTANT: This token is NOT fully ERC-20 compliant.
//   - transfer() does NOT reliably return bool
//   - approve() does NOT emit Approval event
//   - Standard ERC-20 read functions work normally
//
// The ABI below reflects actual on-chain behavior.
// Write functions are typed WITHOUT return values to avoid
// false assumptions about return data.

/**
 * Read-only ABI — standard ERC-20 view functions.
 * These work correctly on the legacy token.
 */
export const SGE_LEGACY_READ_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
] as const;

/**
 * Write ABI — typed WITHOUT return values because the legacy
 * token's transfer() does not reliably return bool.
 * Callers MUST check tx receipt status instead of return value.
 */
export const SGE_LEGACY_WRITE_ABI = [
  // NOTE: No "returns (bool)" — legacy token does not return bool on transfer
  "function transfer(address to, uint256 amount)",
  "function transferFrom(address from, address to, uint256 amount)",
  // approve works but does NOT emit Approval event
  "function approve(address spender, uint256 amount)",
] as const;

/**
 * Combined ABI for contract instantiation.
 */
export const SGE_LEGACY_ABI = [
  ...SGE_LEGACY_READ_ABI,
  ...SGE_LEGACY_WRITE_ABI,
] as const;
