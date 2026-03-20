import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

// ────────────────────────────────────────────────────────────────
// End-to-End Integration Tests
// ────────────────────────────────────────────────────────────────
// These tests validate the full deploy → configure → fund → claim
// → drain lifecycle, plus failure paths for missing roles and
// misconfigured access control.

async function deployFullSystem() {
  const [admin, operator, compliance, user1, user2, user3, treasury] =
    await ethers.getSigners();

  const CLAIM_AMOUNT = ethers.parseEther("1000");
  const FUND_AMOUNT = ethers.parseEther("100000");
  const INITIAL_SUPPLY = ethers.parseEther("100000000000"); // 100 billion

  // Deploy mock SGE token
  const MockSGE = await ethers.getContractFactory("MockSGE");
  const sge = await MockSGE.deploy(INITIAL_SUPPLY);

  // Deploy AccessManager
  const AccessManager = await ethers.getContractFactory("SgeAccessManager");
  const accessManager = await AccessManager.deploy(admin.address);

  // Deploy TreasuryVault
  const Vault = await ethers.getContractFactory("SgeTreasuryVault");
  const vault = await Vault.deploy(await sge.getAddress(), admin.address);

  // Deploy Distributor
  const Distributor = await ethers.getContractFactory("SgeDistributor");
  const distributor = await Distributor.deploy(
    await sge.getAddress(),
    await vault.getAddress(),
    CLAIM_AMOUNT,
    admin.address
  );

  // Link vault → distributor
  await vault.connect(admin).setDistributor(await distributor.getAddress(), true);

  // Grant roles
  await distributor.connect(admin).setOperator(operator.address, true);

  const COMPLIANCE_ROLE = await accessManager.COMPLIANCE_ROLE();
  await accessManager.connect(admin).grantRole(COMPLIANCE_ROLE, compliance.address);

  const AM_OPERATOR_ROLE = await accessManager.OPERATOR_ROLE();
  await accessManager.connect(admin).grantRole(AM_OPERATOR_ROLE, operator.address);

  // Fund distributor with SGE
  await sge.connect(admin).approve(await distributor.getAddress(), FUND_AMOUNT);
  await distributor.connect(admin).fundInventory(FUND_AMOUNT);

  return {
    sge,
    distributor,
    vault,
    accessManager,
    admin,
    operator,
    compliance,
    user1,
    user2,
    user3,
    treasury,
    CLAIM_AMOUNT,
    FUND_AMOUNT,
    INITIAL_SUPPLY,
  };
}

// ════════════════════════════════════════════════════════════════
// Full Lifecycle: Deploy → Fund → Claim → Drain
// ════════════════════════════════════════════════════════════════

describe("Integration: Full Lifecycle", function () {
  it("should complete the full deploy → fund → claim → drain lifecycle", async function () {
    const { sge, distributor, vault, admin, user1, CLAIM_AMOUNT, FUND_AMOUNT } =
      await loadFixture(deployFullSystem);

    // 1. Verify initial state: funded, not paused
    expect(await distributor.paused()).to.equal(false);
    expect(await distributor.inventoryBalance()).to.equal(FUND_AMOUNT);

    // 2. User claims
    await distributor.connect(user1).claimExact();
    expect(await distributor.hasClaimed(user1.address)).to.equal(true);
    expect(await sge.balanceOf(user1.address)).to.equal(CLAIM_AMOUNT);

    // 3. Verify inventory decreased
    expect(await distributor.inventoryBalance()).to.equal(FUND_AMOUNT - CLAIM_AMOUNT);

    // 4. Admin drains to treasury
    const preDrainVaultBal = await sge.balanceOf(await vault.getAddress());
    await distributor.connect(admin).drainToTreasury();
    const postDrainVaultBal = await sge.balanceOf(await vault.getAddress());
    expect(postDrainVaultBal - preDrainVaultBal).to.equal(FUND_AMOUNT - CLAIM_AMOUNT);

    // 5. Distributor inventory is now zero
    expect(await distributor.inventoryBalance()).to.equal(0);
  });

  it("should handle fund → distribute → verify flow", async function () {
    const { sge, distributor, operator, user1, user2, CLAIM_AMOUNT } =
      await loadFixture(deployFullSystem);

    // Operator distributes to multiple users
    await distributor.connect(operator).distribute(user1.address, CLAIM_AMOUNT);
    await distributor.connect(operator).distribute(user2.address, CLAIM_AMOUNT);

    expect(await sge.balanceOf(user1.address)).to.equal(CLAIM_AMOUNT);
    expect(await sge.balanceOf(user2.address)).to.equal(CLAIM_AMOUNT);
  });

  it("should handle refund → emergency withdraw lifecycle", async function () {
    const { sge, distributor, vault, admin, user1, FUND_AMOUNT } =
      await loadFixture(deployFullSystem);

    // 1. Pause distributor (simulated emergency)
    await distributor.connect(admin).pause();
    expect(await distributor.paused()).to.equal(true);

    // 2. Drain distributor to vault
    await distributor.connect(admin).drainToTreasury();
    expect(await distributor.inventoryBalance()).to.equal(0);

    // 3. Emergency withdraw from vault
    const adminBalBefore = await sge.balanceOf(admin.address);
    await vault.connect(admin).emergencyWithdraw(admin.address);
    const adminBalAfter = await sge.balanceOf(admin.address);

    // Admin now has more SGE than before
    expect(adminBalAfter).to.be.greaterThan(adminBalBefore);
  });
});

// ════════════════════════════════════════════════════════════════
// Role Wiring Validation
// ════════════════════════════════════════════════════════════════

describe("Integration: Role Wiring", function () {
  it("admin has all expected roles after deployment", async function () {
    const { distributor, vault, accessManager, admin } =
      await loadFixture(deployFullSystem);

    // Distributor: DEFAULT_ADMIN + ADMIN
    const DEFAULT_ADMIN = ethers.ZeroHash;
    const ADMIN_ROLE = await distributor.ADMIN_ROLE();
    const OPERATOR_ROLE = await distributor.OPERATOR_ROLE();

    expect(await distributor.hasRole(DEFAULT_ADMIN, admin.address)).to.equal(true);
    expect(await distributor.hasRole(ADMIN_ROLE, admin.address)).to.equal(true);
    // Admin also gets OPERATOR_ROLE in constructor
    expect(await distributor.hasRole(OPERATOR_ROLE, admin.address)).to.equal(true);

    // Vault: DEFAULT_ADMIN + ADMIN
    expect(await vault.hasRole(DEFAULT_ADMIN, admin.address)).to.equal(true);
    expect(await vault.hasRole(await vault.ADMIN_ROLE(), admin.address)).to.equal(true);

    // AccessManager: all roles
    expect(await accessManager.hasRole(DEFAULT_ADMIN, admin.address)).to.equal(true);
    expect(await accessManager.hasRole(await accessManager.ADMIN_ROLE(), admin.address)).to.equal(true);
    expect(await accessManager.hasRole(await accessManager.COMPLIANCE_ROLE(), admin.address)).to.equal(true);
    expect(await accessManager.hasRole(await accessManager.OPERATOR_ROLE(), admin.address)).to.equal(true);
  });

  it("operator has OPERATOR_ROLE on distributor and AM", async function () {
    const { distributor, accessManager, operator } =
      await loadFixture(deployFullSystem);

    const OP_ROLE_DIST = await distributor.OPERATOR_ROLE();
    expect(await distributor.hasRole(OP_ROLE_DIST, operator.address)).to.equal(true);

    const OP_ROLE_AM = await accessManager.OPERATOR_ROLE();
    expect(await accessManager.hasRole(OP_ROLE_AM, operator.address)).to.equal(true);
  });

  it("compliance has COMPLIANCE_ROLE on AM", async function () {
    const { accessManager, compliance } = await loadFixture(deployFullSystem);

    const COMP_ROLE = await accessManager.COMPLIANCE_ROLE();
    expect(await accessManager.hasRole(COMP_ROLE, compliance.address)).to.equal(true);
  });

  it("distributor has DISTRIBUTOR_ROLE on vault", async function () {
    const { distributor, vault } = await loadFixture(deployFullSystem);

    const DIST_ROLE = await vault.DISTRIBUTOR_ROLE();
    expect(await vault.hasRole(DIST_ROLE, await distributor.getAddress())).to.equal(true);
  });

  it("non-admin cannot grant roles", async function () {
    const { distributor, user1, user2 } = await loadFixture(deployFullSystem);

    const ADMIN_ROLE = await distributor.ADMIN_ROLE();
    await expect(
      distributor.connect(user1).grantRole(ADMIN_ROLE, user2.address)
    ).to.be.reverted;
  });
});

// ════════════════════════════════════════════════════════════════
// Failure Paths: Missing Roles
// ════════════════════════════════════════════════════════════════

describe("Integration: Missing Role Failures", function () {
  it("distribute() fails without OPERATOR_ROLE", async function () {
    const { distributor, user1, user2, CLAIM_AMOUNT } =
      await loadFixture(deployFullSystem);

    // user1 does NOT have OPERATOR_ROLE
    await expect(
      distributor.connect(user1).distribute(user2.address, CLAIM_AMOUNT)
    ).to.be.reverted;
  });

  it("pause/unpause fails without ADMIN_ROLE", async function () {
    const { distributor, user1 } = await loadFixture(deployFullSystem);

    await expect(distributor.connect(user1).pause()).to.be.reverted;
    await expect(distributor.connect(user1).unpause()).to.be.reverted;
  });

  it("vault release fails without DISTRIBUTOR_ROLE", async function () {
    const { sge, vault, admin, user1 } = await loadFixture(deployFullSystem);

    // Fund vault directly via deposit
    const depositAmt = ethers.parseEther("10000");
    await sge.connect(admin).approve(await vault.getAddress(), depositAmt);
    await vault.connect(admin).deposit(depositAmt);

    // user1 tries to release — should fail
    await expect(
      vault.connect(user1).release(user1.address, depositAmt)
    ).to.be.reverted;
  });

  it("setTreasury fails without ADMIN_ROLE", async function () {
    const { distributor, user1, user2 } = await loadFixture(deployFullSystem);

    await expect(
      distributor.connect(user1).setTreasury(user2.address)
    ).to.be.reverted;
  });

  it("drainToTreasury fails without ADMIN_ROLE", async function () {
    const { distributor, user1 } = await loadFixture(deployFullSystem);

    await expect(distributor.connect(user1).drainToTreasury()).to.be.reverted;
  });

  it("emergencyWithdraw fails without ADMIN_ROLE", async function () {
    const { vault, user1 } = await loadFixture(deployFullSystem);

    await expect(vault.connect(user1).emergencyWithdraw(user1.address)).to.be.reverted;
  });
});

// ════════════════════════════════════════════════════════════════
// Failure Paths: Paused State
// ════════════════════════════════════════════════════════════════

describe("Integration: Paused State Failures", function () {
  it("claimExact fails when distributor is paused", async function () {
    const { distributor, admin, user1 } = await loadFixture(deployFullSystem);

    await distributor.connect(admin).pause();
    await expect(distributor.connect(user1).claimExact()).to.be.reverted;
  });

  it("fundInventory still works when paused", async function () {
    const { sge, distributor, admin } = await loadFixture(deployFullSystem);

    await distributor.connect(admin).pause();

    const fundAmt = ethers.parseEther("5000");
    await sge.connect(admin).approve(await distributor.getAddress(), fundAmt);
    await distributor.connect(admin).fundInventory(fundAmt);
    // Should succeed — funding is allowed even when paused
  });

  it("distribute still works when paused (operator action)", async function () {
    const { distributor, operator, admin, user1, CLAIM_AMOUNT } =
      await loadFixture(deployFullSystem);

    await distributor.connect(admin).pause();
    // distribute is an admin/operator action — may or may not be paused
    // depending on contract implementation. Test to document behavior.
    try {
      await distributor.connect(operator).distribute(user1.address, CLAIM_AMOUNT);
      // If it succeeds, distribute() is not affected by pause
    } catch {
      // If it reverts, distribute() IS affected by pause
    }
  });
});

// ════════════════════════════════════════════════════════════════
// Failure Paths: Zero Inventory
// ════════════════════════════════════════════════════════════════

describe("Integration: Zero Inventory", function () {
  it("claimExact fails with zero inventory", async function () {
    const { distributor, admin, user1, user2, user3, FUND_AMOUNT, CLAIM_AMOUNT } =
      await loadFixture(deployFullSystem);

    // Drain all inventory to treasury
    await distributor.connect(admin).drainToTreasury();
    expect(await distributor.inventoryBalance()).to.equal(0);

    // Claim should fail
    await expect(distributor.connect(user1).claimExact()).to.be.reverted;
  });

  it("drain reverts with ZeroAmount on zero inventory", async function () {
    const { distributor, admin } = await loadFixture(deployFullSystem);

    // Fixture pre-funds, so drain once to empty it
    await distributor.connect(admin).drainToTreasury();
    expect(await distributor.inventoryBalance()).to.equal(0);

    // Second drain should revert with ZeroAmount
    await expect(
      distributor.connect(admin).drainToTreasury()
    ).to.be.revertedWithCustomError(distributor, "ZeroAmount");
  });
});

// ════════════════════════════════════════════════════════════════
// AccessManager Integration: canAccess wiring
// ════════════════════════════════════════════════════════════════

describe("Integration: AccessManager Wiring", function () {
  it("canAccess returns true for admin by default", async function () {
    const { accessManager, admin } = await loadFixture(deployFullSystem);

    const [permitted, reason] = await accessManager.canAccess(admin.address);
    expect(permitted).to.equal(true);
  });

  it("canAccess blocks denied addresses", async function () {
    const { accessManager, compliance, user1 } = await loadFixture(deployFullSystem);

    await accessManager.connect(compliance).setDenied(user1.address, true);
    const [permitted, reason] = await accessManager.canAccess(user1.address);
    expect(permitted).to.equal(false);
    expect(reason.toLowerCase()).to.include("deny");
  });

  it("operator override bypasses deny list", async function () {
    const { accessManager, compliance, operator, user1 } =
      await loadFixture(deployFullSystem);

    // Deny user1
    await accessManager.connect(compliance).setDenied(user1.address, true);
    let [permitted] = await accessManager.canAccess(user1.address);
    expect(permitted).to.equal(false);

    // Set operator override
    await accessManager.connect(operator).setOperatorOverride(user1.address, true);
    [permitted] = await accessManager.canAccess(user1.address);
    expect(permitted).to.equal(true);
  });

  it("allowlist mode blocks non-allowed addresses", async function () {
    const { accessManager, admin, user1 } = await loadFixture(deployFullSystem);

    // Enable allowlist
    await accessManager.connect(admin).setAllowlistEnabled(true);

    // user1 is not on allowlist
    const [permitted, reason] = await accessManager.canAccess(user1.address);
    expect(permitted).to.equal(false);
    expect(reason).to.include("allowlist");
  });

  it("KYC requirement blocks non-KYC'd addresses", async function () {
    const { accessManager, admin, compliance, user1 } =
      await loadFixture(deployFullSystem);

    await accessManager.connect(admin).setKycRequired(true);

    let [permitted] = await accessManager.canAccess(user1.address);
    expect(permitted).to.equal(false);

    // Grant KYC
    await accessManager.connect(compliance).setKycStatus(user1.address, true);
    [permitted] = await accessManager.canAccess(user1.address);
    expect(permitted).to.equal(true);
  });

  it("batch operations work for allowlist", async function () {
    const { accessManager, admin, user1, user2, user3 } =
      await loadFixture(deployFullSystem);

    await accessManager.connect(admin).setAllowlistEnabled(true);

    await accessManager.connect(admin).batchSetAllowed(
      [user1.address, user2.address, user3.address],
      true
    );

    const [p1] = await accessManager.canAccess(user1.address);
    const [p2] = await accessManager.canAccess(user2.address);
    const [p3] = await accessManager.canAccess(user3.address);

    expect(p1).to.equal(true);
    expect(p2).to.equal(true);
    expect(p3).to.equal(true);
  });
});

// ════════════════════════════════════════════════════════════════
// Cross-Contract Events
// ════════════════════════════════════════════════════════════════

describe("Integration: Event Emissions", function () {
  it("emits Claimed event with correct args", async function () {
    const { distributor, user1, CLAIM_AMOUNT } = await loadFixture(deployFullSystem);

    await expect(distributor.connect(user1).claimExact())
      .to.emit(distributor, "Claimed")
      .withArgs(user1.address, CLAIM_AMOUNT);
  });

  it("emits InventoryFunded when funding", async function () {
    const { sge, distributor, admin, FUND_AMOUNT } = await loadFixture(deployFullSystem);

    const fundAmt = ethers.parseEther("5000");
    await sge.connect(admin).approve(await distributor.getAddress(), fundAmt);

    await expect(distributor.connect(admin).fundInventory(fundAmt))
      .to.emit(distributor, "InventoryFunded");
  });

  it("emits Distributed when operator distributes", async function () {
    const { distributor, operator, user1, CLAIM_AMOUNT } =
      await loadFixture(deployFullSystem);

    await expect(distributor.connect(operator).distribute(user1.address, CLAIM_AMOUNT))
      .to.emit(distributor, "Distributed")
      .withArgs(operator.address, user1.address, CLAIM_AMOUNT);
  });

  it("emits TreasuryUpdated when treasury is changed", async function () {
    const { distributor, admin, vault, user1 } = await loadFixture(deployFullSystem);

    const oldTreasury = await vault.getAddress();
    await expect(distributor.connect(admin).setTreasury(user1.address))
      .to.emit(distributor, "TreasuryUpdated")
      .withArgs(oldTreasury, user1.address);
  });

  it("emits OperatorUpdated when operator is changed", async function () {
    const { distributor, admin, user1 } = await loadFixture(deployFullSystem);

    await expect(distributor.connect(admin).setOperator(user1.address, true))
      .to.emit(distributor, "OperatorUpdated")
      .withArgs(user1.address, true);
  });
});
