// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SgeDistributor
 * @notice Controlled distribution of legacy SGE tokens.
 *
 * The legacy SGE token (0x40489719E489782959486A04B765E1e93e5B221a) is NOT
 * fully ERC-20 compliant — transfer() does not return bool, no Approval event.
 * This contract uses SafeERC20 to handle non-standard return values safely.
 *
 * Flow:
 *   1. Admin funds inventory via fundInventory()
 *   2. Operator calls distribute() to send SGE to recipients
 *   3. Or users call claimExact() for self-service claims
 *   4. Admin can pause/unpause, rescue non-SGE tokens, update roles
 *
 * Roles:
 *   ADMIN_ROLE    — full control: pause, rescue, set treasury, update roles
 *   OPERATOR_ROLE — distribute SGE to recipients
 */
contract SgeDistributor is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ── Roles ────────────────────────────────
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ── State ────────────────────────────────
    IERC20 public immutable sgeToken;
    address public treasury;
    uint256 public claimAmount;
    mapping(address => bool) public hasClaimed;

    // ── Events ───────────────────────────────
    event InventoryFunded(address indexed funder, uint256 amount, uint256 newBalance);
    event Distributed(address indexed operator, address indexed recipient, uint256 amount);
    event Claimed(address indexed claimer, uint256 amount);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event TokenRescued(address indexed token, address indexed to, uint256 amount);
    event OperatorUpdated(address indexed operator, bool granted);

    // ── Errors ───────────────────────────────
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientInventory(uint256 requested, uint256 available);
    error AlreadyClaimed(address claimer);
    error CannotRescueSGE();

    // ── Constructor ──────────────────────────
    constructor(
        address _sgeToken,
        address _treasury,
        uint256 _claimAmount,
        address _admin
    ) {
        if (_sgeToken == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_admin == address(0)) revert ZeroAddress();
        if (_claimAmount == 0) revert ZeroAmount();

        sgeToken = IERC20(_sgeToken);
        treasury = _treasury;
        claimAmount = _claimAmount;

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
    }

    // ── Inventory ────────────────────────────

    /**
     * @notice Fund the distributor with SGE tokens.
     * @dev Caller must have approved this contract to spend `amount` SGE.
     *      Uses SafeERC20 to handle legacy token's non-standard transfer.
     */
    function fundInventory(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        sgeToken.safeTransferFrom(msg.sender, address(this), amount);
        emit InventoryFunded(msg.sender, amount, inventoryBalance());
    }

    /**
     * @notice Current SGE balance held by this distributor.
     */
    function inventoryBalance() public view returns (uint256) {
        return sgeToken.balanceOf(address(this));
    }

    // ── Distribution (operator) ──────────────

    /**
     * @notice Distribute SGE to a recipient. Operator-only.
     */
    function distribute(
        address recipient,
        uint256 amount
    ) external onlyRole(OPERATOR_ROLE) nonReentrant whenNotPaused {
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        uint256 balance = inventoryBalance();
        if (amount > balance) revert InsufficientInventory(amount, balance);

        sgeToken.safeTransfer(recipient, amount);
        emit Distributed(msg.sender, recipient, amount);
    }

    // ── Self-service claim ───────────────────

    /**
     * @notice Claim the fixed claimAmount of SGE. Once per wallet.
     */
    function claimExact() external nonReentrant whenNotPaused {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed(msg.sender);
        uint256 balance = inventoryBalance();
        if (claimAmount > balance) revert InsufficientInventory(claimAmount, balance);

        hasClaimed[msg.sender] = true;
        sgeToken.safeTransfer(msg.sender, claimAmount);
        emit Claimed(msg.sender, claimAmount);
    }

    // ── Admin controls ───────────────────────

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function setTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddress();
        address old = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(old, newTreasury);
    }

    function setClaimAmount(uint256 newAmount) external onlyRole(ADMIN_ROLE) {
        if (newAmount == 0) revert ZeroAmount();
        uint256 old = claimAmount;
        claimAmount = newAmount;
        emit ClaimAmountUpdated(old, newAmount);
    }

    function setOperator(address operator, bool granted) external onlyRole(ADMIN_ROLE) {
        if (operator == address(0)) revert ZeroAddress();
        if (granted) {
            _grantRole(OPERATOR_ROLE, operator);
        } else {
            _revokeRole(OPERATOR_ROLE, operator);
        }
        emit OperatorUpdated(operator, granted);
    }

    /**
     * @notice Rescue non-SGE tokens accidentally sent to this contract.
     * @dev Cannot rescue the SGE token itself — use distribute() or
     *      drain to treasury instead.
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

    /**
     * @notice Drain all SGE inventory back to treasury. Admin emergency.
     */
    function drainToTreasury() external onlyRole(ADMIN_ROLE) nonReentrant {
        uint256 balance = inventoryBalance();
        if (balance == 0) revert ZeroAmount();
        sgeToken.safeTransfer(treasury, balance);
        emit Distributed(msg.sender, treasury, balance);
    }
}
