// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SgeTreasuryVault
 * @notice Secure custody of SGE token inventory, separated from
 *         distribution logic.
 *
 * The vault holds SGE and only releases it to authorized distributors
 * or via admin emergency operations. This separation ensures the
 * distributor contract can be upgraded/replaced without moving custody.
 *
 * Uses SafeERC20 for the legacy SGE token's non-standard behavior.
 *
 * Roles:
 *   ADMIN_ROLE       — full control: pause, rescue, add/remove distributors
 *   DISTRIBUTOR_ROLE — authorized contracts that can request SGE withdrawals
 */
contract SgeTreasuryVault is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ── Roles ────────────────────────────────
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

    // ── State ────────────────────────────────
    IERC20 public immutable sgeToken;

    // ── Events ───────────────────────────────
    event Deposited(address indexed depositor, uint256 amount, uint256 newBalance);
    event Released(address indexed distributor, address indexed to, uint256 amount);
    event EmergencyWithdraw(address indexed admin, address indexed to, uint256 amount);
    event DistributorUpdated(address indexed distributor, bool authorized);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);

    // ── Errors ───────────────────────────────
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance(uint256 requested, uint256 available);
    error CannotRescueSGE();

    // ── Constructor ──────────────────────────
    constructor(address _sgeToken, address _admin) {
        if (_sgeToken == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();

        sgeToken = IERC20(_sgeToken);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
    }

    // ── Deposit ──────────────────────────────

    /**
     * @notice Deposit SGE into the vault.
     * @dev Caller must have approved this contract for `amount`.
     */
    function deposit(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        sgeToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount, balance());
    }

    /**
     * @notice Current SGE balance held by this vault.
     */
    function balance() public view returns (uint256) {
        return sgeToken.balanceOf(address(this));
    }

    // ── Release (distributor only) ───────────

    /**
     * @notice Release SGE to a target address. Only callable by
     *         authorized distributors.
     */
    function release(
        address to,
        uint256 amount
    ) external onlyRole(DISTRIBUTOR_ROLE) nonReentrant whenNotPaused {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        uint256 bal = balance();
        if (amount > bal) revert InsufficientBalance(amount, bal);

        sgeToken.safeTransfer(to, amount);
        emit Released(msg.sender, to, amount);
    }

    // ── Admin controls ───────────────────────

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function setDistributor(address distributor, bool authorized) external onlyRole(ADMIN_ROLE) {
        if (distributor == address(0)) revert ZeroAddress();
        if (authorized) {
            _grantRole(DISTRIBUTOR_ROLE, distributor);
        } else {
            _revokeRole(DISTRIBUTOR_ROLE, distributor);
        }
        emit DistributorUpdated(distributor, authorized);
    }

    /**
     * @notice Emergency: withdraw all SGE to a given address.
     */
    function emergencyWithdraw(address to) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balance();
        if (bal == 0) revert ZeroAmount();
        sgeToken.safeTransfer(to, bal);
        emit EmergencyWithdraw(msg.sender, to, bal);
    }

    /**
     * @notice Rescue non-SGE tokens accidentally sent to this vault.
     */
    function rescueToken(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (token == address(sgeToken)) revert CannotRescueSGE();
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        IERC20(token).safeTransfer(to, amount);
        emit TokenRescued(token, to, amount);
    }
}
