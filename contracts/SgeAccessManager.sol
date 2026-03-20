// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title SgeAccessManager
 * @notice Lightweight compliance and access control layer for SGE distribution.
 *
 * Features:
 *   - Allowlist: only approved addresses can receive SGE
 *   - Denylist: blocked addresses (sanctions, compliance)
 *   - KYC requirement toggle
 *   - Jurisdiction placeholder
 *   - Operator override for manual approvals
 *
 * This contract can be queried by the distributor before executing claims.
 * It does NOT hold any tokens — it is a pure access gate.
 *
 * Roles:
 *   ADMIN_ROLE      — full control
 *   COMPLIANCE_ROLE — manage allowlist/denylist
 *   OPERATOR_ROLE   — manual overrides
 */
contract SgeAccessManager is AccessControl {
    // ── Roles ────────────────────────────────
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ── State ────────────────────────────────
    bool public allowlistEnabled;
    bool public kycRequired;
    string public jurisdiction; // e.g. "US", "EU", "" for none

    mapping(address => bool) public isAllowed;
    mapping(address => bool) public isDenied;
    mapping(address => bool) public hasKyc;
    mapping(address => bool) public operatorOverride;

    // ── Events ───────────────────────────────
    event AllowlistToggled(bool enabled);
    event KycRequirementToggled(bool required);
    event JurisdictionUpdated(string jurisdiction);
    event AddressAllowed(address indexed account, bool allowed);
    event AddressDenied(address indexed account, bool denied);
    event KycStatusUpdated(address indexed account, bool status);
    event OperatorOverrideSet(address indexed account, bool overridden);

    // ── Errors ───────────────────────────────
    error AccessDenied(address account, string reason);
    error ZeroAddress();

    // ── Constructor ──────────────────────────
    constructor(address _admin) {
        if (_admin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(COMPLIANCE_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        // Defaults: off — no restrictions
        allowlistEnabled = false;
        kycRequired = false;
        jurisdiction = "";
    }

    // ── Access check ─────────────────────────

    /**
     * @notice Check if an address is permitted to receive SGE.
     * @return permitted True if allowed, false if blocked
     * @return reason Human-readable reason if blocked
     */
    function canAccess(address account) external view returns (bool permitted, string memory reason) {
        // Operator override bypasses all checks
        if (operatorOverride[account]) {
            return (true, "");
        }

        // Denylist always blocks
        if (isDenied[account]) {
            return (false, "Address is on denylist");
        }

        // Allowlist check
        if (allowlistEnabled && !isAllowed[account]) {
            return (false, "Address not on allowlist");
        }

        // KYC check
        if (kycRequired && !hasKyc[account]) {
            return (false, "KYC not completed");
        }

        return (true, "");
    }

    // ── Admin controls ───────────────────────

    function setAllowlistEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        allowlistEnabled = enabled;
        emit AllowlistToggled(enabled);
    }

    function setKycRequired(bool required) external onlyRole(ADMIN_ROLE) {
        kycRequired = required;
        emit KycRequirementToggled(required);
    }

    function setJurisdiction(string calldata _jurisdiction) external onlyRole(ADMIN_ROLE) {
        jurisdiction = _jurisdiction;
        emit JurisdictionUpdated(_jurisdiction);
    }

    // ── Compliance controls ──────────────────

    function setAllowed(address account, bool allowed) external onlyRole(COMPLIANCE_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        isAllowed[account] = allowed;
        emit AddressAllowed(account, allowed);
    }

    function setDenied(address account, bool denied) external onlyRole(COMPLIANCE_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        isDenied[account] = denied;
        emit AddressDenied(account, denied);
    }

    function setKycStatus(address account, bool status) external onlyRole(COMPLIANCE_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        hasKyc[account] = status;
        emit KycStatusUpdated(account, status);
    }

    // ── Operator controls ────────────────────

    function setOperatorOverride(address account, bool overridden) external onlyRole(OPERATOR_ROLE) {
        if (account == address(0)) revert ZeroAddress();
        operatorOverride[account] = overridden;
        emit OperatorOverrideSet(account, overridden);
    }

    // ── Batch operations ─────────────────────

    function batchSetAllowed(address[] calldata accounts, bool allowed) external onlyRole(COMPLIANCE_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert ZeroAddress();
            isAllowed[accounts[i]] = allowed;
            emit AddressAllowed(accounts[i], allowed);
        }
    }

    function batchSetDenied(address[] calldata accounts, bool denied) external onlyRole(COMPLIANCE_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] == address(0)) revert ZeroAddress();
            isDenied[accounts[i]] = denied;
            emit AddressDenied(accounts[i], denied);
        }
    }
}
