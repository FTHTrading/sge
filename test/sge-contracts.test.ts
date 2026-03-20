import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

// ────────────────────────────────────────────────────────────────
// Shared fixture — deploys MockSGE + all 3 contracts + links them
// ────────────────────────────────────────────────────────────────

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
  const OPERATOR_ROLE = await distributor.OPERATOR_ROLE();
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
// SgeDistributor
// ════════════════════════════════════════════════════════════════

describe("SgeDistributor", function () {
  // ── Constructor ──────────────────────────

  describe("constructor", function () {
    it("reverts if sgeToken is zero address", async function () {
      const [admin] = await ethers.getSigners();
      const Distributor = await ethers.getContractFactory("SgeDistributor");
      await expect(
        Distributor.deploy(ethers.ZeroAddress, admin.address, 1000, admin.address)
      ).to.be.revertedWithCustomError(Distributor, "ZeroAddress");
    });

    it("reverts if treasury is zero address", async function () {
      const { sge, admin } = await loadFixture(deployFullSystem);
      const Distributor = await ethers.getContractFactory("SgeDistributor");
      await expect(
        Distributor.deploy(await sge.getAddress(), ethers.ZeroAddress, 1000, admin.address)
      ).to.be.revertedWithCustomError(Distributor, "ZeroAddress");
    });

    it("reverts if admin is zero address", async function () {
      const { sge, vault } = await loadFixture(deployFullSystem);
      const Distributor = await ethers.getContractFactory("SgeDistributor");
      await expect(
        Distributor.deploy(await sge.getAddress(), await vault.getAddress(), 1000, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Distributor, "ZeroAddress");
    });

    it("reverts if claimAmount is zero", async function () {
      const { sge, vault, admin } = await loadFixture(deployFullSystem);
      const Distributor = await ethers.getContractFactory("SgeDistributor");
      await expect(
        Distributor.deploy(await sge.getAddress(), await vault.getAddress(), 0, admin.address)
      ).to.be.revertedWithCustomError(Distributor, "ZeroAmount");
    });

    it("sets immutables and roles correctly", async function () {
      const { distributor, sge, vault, admin, CLAIM_AMOUNT } =
        await loadFixture(deployFullSystem);
      expect(await distributor.sgeToken()).to.equal(await sge.getAddress());
      expect(await distributor.treasury()).to.equal(await vault.getAddress());
      expect(await distributor.claimAmount()).to.equal(CLAIM_AMOUNT);
      expect(await distributor.hasRole(await distributor.ADMIN_ROLE(), admin.address)).to.be.true;
      expect(await distributor.hasRole(await distributor.DEFAULT_ADMIN_ROLE(), admin.address)).to.be
        .true;
    });
  });

  // ── fundInventory ──────────────────────────

  describe("fundInventory", function () {
    it("accepts SGE and emits InventoryFunded", async function () {
      const { distributor, sge, user1, FUND_AMOUNT } = await loadFixture(deployFullSystem);
      const amount = ethers.parseEther("500");

      // user1 needs some SGE first
      await sge.transfer(user1.address, amount);
      await sge.connect(user1).approve(await distributor.getAddress(), amount);

      await expect(distributor.connect(user1).fundInventory(amount))
        .to.emit(distributor, "InventoryFunded")
        .withArgs(user1.address, amount, FUND_AMOUNT + amount);
    });

    it("reverts on zero amount", async function () {
      const { distributor, admin } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(admin).fundInventory(0)
      ).to.be.revertedWithCustomError(distributor, "ZeroAmount");
    });
  });

  // ── distribute (operator) ──────────────────

  describe("distribute", function () {
    it("operator can distribute SGE to a recipient", async function () {
      const { distributor, sge, operator, user1 } = await loadFixture(deployFullSystem);
      const amount = ethers.parseEther("100");

      await expect(distributor.connect(operator).distribute(user1.address, amount))
        .to.emit(distributor, "Distributed")
        .withArgs(operator.address, user1.address, amount);

      expect(await sge.balanceOf(user1.address)).to.equal(amount);
    });

    it("reverts if caller lacks OPERATOR_ROLE", async function () {
      const { distributor, user1, user2 } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(user1).distribute(user2.address, 100)
      ).to.be.reverted;
    });

    it("reverts if recipient is zero address", async function () {
      const { distributor, operator } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(operator).distribute(ethers.ZeroAddress, 100)
      ).to.be.revertedWithCustomError(distributor, "ZeroAddress");
    });

    it("reverts if amount is zero", async function () {
      const { distributor, operator, user1 } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(operator).distribute(user1.address, 0)
      ).to.be.revertedWithCustomError(distributor, "ZeroAmount");
    });

    it("reverts if insufficient inventory", async function () {
      const { distributor, operator, user1, FUND_AMOUNT } = await loadFixture(deployFullSystem);
      const tooMuch = FUND_AMOUNT + ethers.parseEther("1");
      await expect(
        distributor.connect(operator).distribute(user1.address, tooMuch)
      ).to.be.revertedWithCustomError(distributor, "InsufficientInventory");
    });

    it("reverts when paused", async function () {
      const { distributor, admin, operator, user1 } = await loadFixture(deployFullSystem);
      await distributor.connect(admin).pause();
      await expect(
        distributor.connect(operator).distribute(user1.address, 100)
      ).to.be.revertedWithCustomError(distributor, "EnforcedPause");
    });
  });

  // ── claimExact ──────────────────────────

  describe("claimExact", function () {
    it("allows a user to claim the fixed amount", async function () {
      const { distributor, sge, user1, CLAIM_AMOUNT } = await loadFixture(deployFullSystem);

      await expect(distributor.connect(user1).claimExact())
        .to.emit(distributor, "Claimed")
        .withArgs(user1.address, CLAIM_AMOUNT);

      expect(await sge.balanceOf(user1.address)).to.equal(CLAIM_AMOUNT);
      expect(await distributor.hasClaimed(user1.address)).to.be.true;
    });

    it("reverts on second claim (same wallet)", async function () {
      const { distributor, user1 } = await loadFixture(deployFullSystem);
      await distributor.connect(user1).claimExact();
      await expect(
        distributor.connect(user1).claimExact()
      ).to.be.revertedWithCustomError(distributor, "AlreadyClaimed");
    });

    it("allows different users to each claim once", async function () {
      const { distributor, sge, user1, user2, user3, CLAIM_AMOUNT } =
        await loadFixture(deployFullSystem);

      await distributor.connect(user1).claimExact();
      await distributor.connect(user2).claimExact();
      await distributor.connect(user3).claimExact();

      expect(await sge.balanceOf(user1.address)).to.equal(CLAIM_AMOUNT);
      expect(await sge.balanceOf(user2.address)).to.equal(CLAIM_AMOUNT);
      expect(await sge.balanceOf(user3.address)).to.equal(CLAIM_AMOUNT);
    });

    it("reverts if inventory is insufficient", async function () {
      const { distributor, admin, user1, FUND_AMOUNT } =
        await loadFixture(deployFullSystem);

      // Set claim amount higher than inventory
      await distributor.connect(admin).setClaimAmount(FUND_AMOUNT + 1n);

      await expect(
        distributor.connect(user1).claimExact()
      ).to.be.revertedWithCustomError(distributor, "InsufficientInventory");
    });

    it("reverts when paused", async function () {
      const { distributor, admin, user1 } = await loadFixture(deployFullSystem);
      await distributor.connect(admin).pause();
      await expect(
        distributor.connect(user1).claimExact()
      ).to.be.revertedWithCustomError(distributor, "EnforcedPause");
    });
  });

  // ── Admin controls ──────────────────────────

  describe("admin controls", function () {
    it("admin can pause and unpause", async function () {
      const { distributor, admin } = await loadFixture(deployFullSystem);
      await distributor.connect(admin).pause();
      expect(await distributor.paused()).to.be.true;
      await distributor.connect(admin).unpause();
      expect(await distributor.paused()).to.be.false;
    });

    it("non-admin cannot pause", async function () {
      const { distributor, user1 } = await loadFixture(deployFullSystem);
      await expect(distributor.connect(user1).pause()).to.be.reverted;
    });

    it("admin can set treasury", async function () {
      const { distributor, admin, treasury, vault } = await loadFixture(deployFullSystem);
      await expect(distributor.connect(admin).setTreasury(treasury.address))
        .to.emit(distributor, "TreasuryUpdated")
        .withArgs(await vault.getAddress(), treasury.address);
      expect(await distributor.treasury()).to.equal(treasury.address);
    });

    it("setTreasury reverts on zero address", async function () {
      const { distributor, admin } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(admin).setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(distributor, "ZeroAddress");
    });

    it("admin can update claim amount", async function () {
      const { distributor, admin, CLAIM_AMOUNT } = await loadFixture(deployFullSystem);
      const newAmount = ethers.parseEther("2000");
      await expect(distributor.connect(admin).setClaimAmount(newAmount))
        .to.emit(distributor, "ClaimAmountUpdated")
        .withArgs(CLAIM_AMOUNT, newAmount);
      expect(await distributor.claimAmount()).to.equal(newAmount);
    });

    it("setClaimAmount reverts on zero", async function () {
      const { distributor, admin } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(admin).setClaimAmount(0)
      ).to.be.revertedWithCustomError(distributor, "ZeroAmount");
    });

    it("admin can grant and revoke operator", async function () {
      const { distributor, admin, user1 } = await loadFixture(deployFullSystem);
      await distributor.connect(admin).setOperator(user1.address, true);
      const opRole = await distributor.OPERATOR_ROLE();
      expect(await distributor.hasRole(opRole, user1.address)).to.be.true;

      await distributor.connect(admin).setOperator(user1.address, false);
      expect(await distributor.hasRole(opRole, user1.address)).to.be.false;
    });
  });

  // ── rescueToken ──────────────────────────

  describe("rescueToken", function () {
    it("admin can rescue a non-SGE token", async function () {
      const { distributor, admin, user1 } = await loadFixture(deployFullSystem);

      // Deploy a second mock token
      const Mock = await ethers.getContractFactory("MockERC20");
      const other = await Mock.deploy("Other", "OTH", ethers.parseEther("1000"));

      // Send some to the distributor
      await other.transfer(await distributor.getAddress(), ethers.parseEther("50"));

      await expect(
        distributor
          .connect(admin)
          .rescueToken(await other.getAddress(), user1.address, ethers.parseEther("50"))
      )
        .to.emit(distributor, "TokenRescued")
        .withArgs(await other.getAddress(), user1.address, ethers.parseEther("50"));

      expect(await other.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("reverts when trying to rescue SGE token", async function () {
      const { distributor, sge, admin, user1 } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(admin).rescueToken(await sge.getAddress(), user1.address, 1)
      ).to.be.revertedWithCustomError(distributor, "CannotRescueSGE");
    });

    it("reverts for non-admin", async function () {
      const { distributor, user1, user2 } = await loadFixture(deployFullSystem);
      await expect(
        distributor.connect(user1).rescueToken(user2.address, user2.address, 1)
      ).to.be.reverted;
    });
  });

  // ── drainToTreasury ──────────────────────

  describe("drainToTreasury", function () {
    it("drains all SGE to treasury", async function () {
      const { distributor, sge, admin, vault, FUND_AMOUNT } =
        await loadFixture(deployFullSystem);

      const treasuryAddr = await vault.getAddress();
      const balBefore = await sge.balanceOf(treasuryAddr);

      await distributor.connect(admin).drainToTreasury();

      expect(await distributor.inventoryBalance()).to.equal(0);
      expect(await sge.balanceOf(treasuryAddr)).to.equal(balBefore + FUND_AMOUNT);
    });

    it("reverts if inventory is zero", async function () {
      const { distributor, admin } = await loadFixture(deployFullSystem);
      await distributor.connect(admin).drainToTreasury();
      await expect(
        distributor.connect(admin).drainToTreasury()
      ).to.be.revertedWithCustomError(distributor, "ZeroAmount");
    });

    it("reverts for non-admin", async function () {
      const { distributor, user1 } = await loadFixture(deployFullSystem);
      await expect(distributor.connect(user1).drainToTreasury()).to.be.reverted;
    });
  });
});

// ════════════════════════════════════════════════════════════════
// SgeTreasuryVault
// ════════════════════════════════════════════════════════════════

describe("SgeTreasuryVault", function () {
  describe("constructor", function () {
    it("reverts if sgeToken is zero address", async function () {
      const [admin] = await ethers.getSigners();
      const Vault = await ethers.getContractFactory("SgeTreasuryVault");
      await expect(
        Vault.deploy(ethers.ZeroAddress, admin.address)
      ).to.be.revertedWithCustomError(Vault, "ZeroAddress");
    });

    it("reverts if admin is zero address", async function () {
      const { sge } = await loadFixture(deployFullSystem);
      const Vault = await ethers.getContractFactory("SgeTreasuryVault");
      await expect(
        Vault.deploy(await sge.getAddress(), ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(Vault, "ZeroAddress");
    });

    it("sets immutables and roles", async function () {
      const { vault, sge, admin } = await loadFixture(deployFullSystem);
      expect(await vault.sgeToken()).to.equal(await sge.getAddress());
      expect(await vault.hasRole(await vault.ADMIN_ROLE(), admin.address)).to.be.true;
    });
  });

  describe("deposit", function () {
    it("accepts SGE deposits", async function () {
      const { vault, sge, admin } = await loadFixture(deployFullSystem);
      const amount = ethers.parseEther("1000");
      await sge.connect(admin).approve(await vault.getAddress(), amount);

      await expect(vault.connect(admin).deposit(amount))
        .to.emit(vault, "Deposited")
        .withArgs(admin.address, amount, amount);

      expect(await vault.balance()).to.equal(amount);
    });

    it("reverts on zero amount", async function () {
      const { vault, admin } = await loadFixture(deployFullSystem);
      await expect(
        vault.connect(admin).deposit(0)
      ).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });
  });

  describe("release", function () {
    it("authorized distributor can release SGE", async function () {
      const { vault, sge, admin, distributor, user1 } = await loadFixture(deployFullSystem);

      // Deposit some SGE into vault
      const amount = ethers.parseEther("500");
      await sge.connect(admin).approve(await vault.getAddress(), amount);
      await vault.connect(admin).deposit(amount);

      // Distributor contract has DISTRIBUTOR_ROLE — but we need to call from the contract
      // Instead, grant distributor role to admin for testing
      await vault.connect(admin).setDistributor(admin.address, true);

      await expect(vault.connect(admin).release(user1.address, amount))
        .to.emit(vault, "Released")
        .withArgs(admin.address, user1.address, amount);

      expect(await sge.balanceOf(user1.address)).to.equal(amount);
    });

    it("reverts if caller lacks DISTRIBUTOR_ROLE", async function () {
      const { vault, user1, user2 } = await loadFixture(deployFullSystem);
      await expect(
        vault.connect(user1).release(user2.address, 100)
      ).to.be.reverted;
    });

    it("reverts if recipient is zero", async function () {
      const { vault, admin } = await loadFixture(deployFullSystem);
      await vault.connect(admin).setDistributor(admin.address, true);
      await expect(
        vault.connect(admin).release(ethers.ZeroAddress, 100)
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("reverts if amount exceeds balance", async function () {
      const { vault, admin } = await loadFixture(deployFullSystem);
      await vault.connect(admin).setDistributor(admin.address, true);
      await expect(
        vault.connect(admin).release(admin.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
    });

    it("reverts when paused", async function () {
      const { vault, sge, admin, user1 } = await loadFixture(deployFullSystem);
      const amount = ethers.parseEther("100");
      await sge.connect(admin).approve(await vault.getAddress(), amount);
      await vault.connect(admin).deposit(amount);
      await vault.connect(admin).setDistributor(admin.address, true);

      await vault.connect(admin).pause();
      await expect(
        vault.connect(admin).release(user1.address, amount)
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
    });
  });

  describe("setDistributor", function () {
    it("admin can authorize and de-authorize a distributor", async function () {
      const { vault, admin, user1 } = await loadFixture(deployFullSystem);
      const distRole = await vault.DISTRIBUTOR_ROLE();

      await expect(vault.connect(admin).setDistributor(user1.address, true))
        .to.emit(vault, "DistributorUpdated")
        .withArgs(user1.address, true);
      expect(await vault.hasRole(distRole, user1.address)).to.be.true;

      await vault.connect(admin).setDistributor(user1.address, false);
      expect(await vault.hasRole(distRole, user1.address)).to.be.false;
    });

    it("reverts for zero address", async function () {
      const { vault, admin } = await loadFixture(deployFullSystem);
      await expect(
        vault.connect(admin).setDistributor(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(vault, "ZeroAddress");
    });

    it("reverts for non-admin", async function () {
      const { vault, user1, user2 } = await loadFixture(deployFullSystem);
      await expect(
        vault.connect(user1).setDistributor(user2.address, true)
      ).to.be.reverted;
    });
  });

  describe("emergencyWithdraw", function () {
    it("admin can emergency-withdraw all SGE", async function () {
      const { vault, sge, admin, treasury } = await loadFixture(deployFullSystem);
      const amount = ethers.parseEther("5000");
      await sge.connect(admin).approve(await vault.getAddress(), amount);
      await vault.connect(admin).deposit(amount);

      await expect(vault.connect(admin).emergencyWithdraw(treasury.address))
        .to.emit(vault, "EmergencyWithdraw")
        .withArgs(admin.address, treasury.address, amount);

      expect(await vault.balance()).to.equal(0);
      expect(await sge.balanceOf(treasury.address)).to.equal(amount);
    });

    it("reverts if vault is empty", async function () {
      const { vault, admin, treasury } = await loadFixture(deployFullSystem);
      await expect(
        vault.connect(admin).emergencyWithdraw(treasury.address)
      ).to.be.revertedWithCustomError(vault, "ZeroAmount");
    });

    it("reverts for non-admin", async function () {
      const { vault, user1 } = await loadFixture(deployFullSystem);
      await expect(
        vault.connect(user1).emergencyWithdraw(user1.address)
      ).to.be.reverted;
    });
  });

  describe("rescueToken", function () {
    it("admin can rescue a non-SGE token from vault", async function () {
      const { vault, admin, user1 } = await loadFixture(deployFullSystem);

      const Mock = await ethers.getContractFactory("MockERC20");
      const other = await Mock.deploy("Other", "OTH", ethers.parseEther("1000"));
      await other.transfer(await vault.getAddress(), ethers.parseEther("100"));

      await vault
        .connect(admin)
        .rescueToken(await other.getAddress(), user1.address, ethers.parseEther("100"));

      expect(await other.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("reverts when trying to rescue SGE", async function () {
      const { vault, sge, admin, user1 } = await loadFixture(deployFullSystem);
      await expect(
        vault.connect(admin).rescueToken(await sge.getAddress(), user1.address, 1)
      ).to.be.revertedWithCustomError(vault, "CannotRescueSGE");
    });
  });
});

// ════════════════════════════════════════════════════════════════
// SgeAccessManager
// ════════════════════════════════════════════════════════════════

describe("SgeAccessManager", function () {
  describe("constructor", function () {
    it("reverts if admin is zero address", async function () {
      const AM = await ethers.getContractFactory("SgeAccessManager");
      await expect(AM.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        AM,
        "ZeroAddress"
      );
    });

    it("grants all four roles to admin", async function () {
      const { accessManager, admin } = await loadFixture(deployFullSystem);
      expect(await accessManager.hasRole(await accessManager.DEFAULT_ADMIN_ROLE(), admin.address)).to
        .be.true;
      expect(await accessManager.hasRole(await accessManager.ADMIN_ROLE(), admin.address)).to.be
        .true;
      expect(await accessManager.hasRole(await accessManager.COMPLIANCE_ROLE(), admin.address)).to.be
        .true;
      expect(await accessManager.hasRole(await accessManager.OPERATOR_ROLE(), admin.address)).to.be
        .true;
    });

    it("starts with allowlist and KYC disabled", async function () {
      const { accessManager } = await loadFixture(deployFullSystem);
      expect(await accessManager.allowlistEnabled()).to.be.false;
      expect(await accessManager.kycRequired()).to.be.false;
      expect(await accessManager.jurisdiction()).to.equal("");
    });
  });

  describe("canAccess (default — no restrictions)", function () {
    it("allows any address by default", async function () {
      const { accessManager, user1 } = await loadFixture(deployFullSystem);
      const [permitted, reason] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.true;
      expect(reason).to.equal("");
    });
  });

  describe("denylist", function () {
    it("denies access for a denied address", async function () {
      const { accessManager, compliance, user1 } = await loadFixture(deployFullSystem);
      await accessManager.connect(compliance).setDenied(user1.address, true);

      const [permitted, reason] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.false;
      expect(reason).to.equal("Address is on denylist");
    });

    it("un-denying restores access", async function () {
      const { accessManager, compliance, user1 } = await loadFixture(deployFullSystem);
      await accessManager.connect(compliance).setDenied(user1.address, true);
      await accessManager.connect(compliance).setDenied(user1.address, false);

      const [permitted] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.true;
    });

    it("reverts for zero address", async function () {
      const { accessManager, compliance } = await loadFixture(deployFullSystem);
      await expect(
        accessManager.connect(compliance).setDenied(ethers.ZeroAddress, true)
      ).to.be.revertedWithCustomError(accessManager, "ZeroAddress");
    });
  });

  describe("allowlist", function () {
    it("blocks non-allowed address when allowlist is enabled", async function () {
      const { accessManager, admin, user1 } = await loadFixture(deployFullSystem);
      await accessManager.connect(admin).setAllowlistEnabled(true);

      const [permitted, reason] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.false;
      expect(reason).to.equal("Address not on allowlist");
    });

    it("allows address after being added to allowlist", async function () {
      const { accessManager, admin, compliance, user1 } =
        await loadFixture(deployFullSystem);
      await accessManager.connect(admin).setAllowlistEnabled(true);
      await accessManager.connect(compliance).setAllowed(user1.address, true);

      const [permitted] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.true;
    });
  });

  describe("KYC", function () {
    it("blocks non-KYC address when KYC is required", async function () {
      const { accessManager, admin, user1 } = await loadFixture(deployFullSystem);
      await accessManager.connect(admin).setKycRequired(true);

      const [permitted, reason] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.false;
      expect(reason).to.equal("KYC not completed");
    });

    it("allows address after KYC is marked", async function () {
      const { accessManager, admin, compliance, user1 } =
        await loadFixture(deployFullSystem);
      await accessManager.connect(admin).setKycRequired(true);
      await accessManager.connect(compliance).setKycStatus(user1.address, true);

      const [permitted] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.true;
    });
  });

  describe("operator override", function () {
    it("override bypasses denylist", async function () {
      const { accessManager, compliance, operator, user1 } =
        await loadFixture(deployFullSystem);

      await accessManager.connect(compliance).setDenied(user1.address, true);
      await accessManager.connect(operator).setOperatorOverride(user1.address, true);

      const [permitted] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.true;
    });

    it("override bypasses allowlist + KYC", async function () {
      const { accessManager, admin, operator, user1 } =
        await loadFixture(deployFullSystem);

      await accessManager.connect(admin).setAllowlistEnabled(true);
      await accessManager.connect(admin).setKycRequired(true);
      await accessManager.connect(operator).setOperatorOverride(user1.address, true);

      const [permitted] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.true;
    });

    it("removing override re-applies restrictions", async function () {
      const { accessManager, admin, operator, user1 } =
        await loadFixture(deployFullSystem);

      await accessManager.connect(admin).setAllowlistEnabled(true);
      await accessManager.connect(operator).setOperatorOverride(user1.address, true);
      await accessManager.connect(operator).setOperatorOverride(user1.address, false);

      const [permitted] = await accessManager.canAccess(user1.address);
      expect(permitted).to.be.false;
    });
  });

  describe("batch operations", function () {
    it("batchSetAllowed adds multiple addresses", async function () {
      const { accessManager, admin, compliance, user1, user2, user3 } =
        await loadFixture(deployFullSystem);

      await accessManager.connect(admin).setAllowlistEnabled(true);
      await accessManager
        .connect(compliance)
        .batchSetAllowed([user1.address, user2.address, user3.address], true);

      for (const user of [user1, user2, user3]) {
        const [permitted] = await accessManager.canAccess(user.address);
        expect(permitted).to.be.true;
      }
    });

    it("batchSetDenied blocks multiple addresses", async function () {
      const { accessManager, compliance, user1, user2 } =
        await loadFixture(deployFullSystem);

      await accessManager
        .connect(compliance)
        .batchSetDenied([user1.address, user2.address], true);

      for (const user of [user1, user2]) {
        const [permitted, reason] = await accessManager.canAccess(user.address);
        expect(permitted).to.be.false;
        expect(reason).to.equal("Address is on denylist");
      }
    });

    it("batch reverts if any address is zero", async function () {
      const { accessManager, compliance, user1 } = await loadFixture(deployFullSystem);
      await expect(
        accessManager
          .connect(compliance)
          .batchSetAllowed([user1.address, ethers.ZeroAddress], true)
      ).to.be.revertedWithCustomError(accessManager, "ZeroAddress");
    });
  });

  describe("admin controls", function () {
    it("admin can set jurisdiction", async function () {
      const { accessManager, admin } = await loadFixture(deployFullSystem);
      await expect(accessManager.connect(admin).setJurisdiction("US"))
        .to.emit(accessManager, "JurisdictionUpdated")
        .withArgs("US");
      expect(await accessManager.jurisdiction()).to.equal("US");
    });

    it("non-admin cannot toggle allowlist", async function () {
      const { accessManager, user1 } = await loadFixture(deployFullSystem);
      await expect(
        accessManager.connect(user1).setAllowlistEnabled(true)
      ).to.be.reverted;
    });

    it("non-compliance cannot set allowed", async function () {
      const { accessManager, user1, user2 } = await loadFixture(deployFullSystem);
      await expect(
        accessManager.connect(user1).setAllowed(user2.address, true)
      ).to.be.reverted;
    });

    it("non-operator cannot set override", async function () {
      const { accessManager, user1, user2 } = await loadFixture(deployFullSystem);
      await expect(
        accessManager.connect(user1).setOperatorOverride(user2.address, true)
      ).to.be.reverted;
    });
  });
});

// ════════════════════════════════════════════════════════════════
// Cross-contract integration
// ════════════════════════════════════════════════════════════════

describe("Cross-contract integration", function () {
  it("end-to-end: fund → claim → drain → emergency", async function () {
    const { distributor, vault, sge, admin, user1, CLAIM_AMOUNT, FUND_AMOUNT } =
      await loadFixture(deployFullSystem);

    // 1. Verify initial state
    expect(await distributor.inventoryBalance()).to.equal(FUND_AMOUNT);

    // 2. User claims
    await distributor.connect(user1).claimExact();
    expect(await sge.balanceOf(user1.address)).to.equal(CLAIM_AMOUNT);
    expect(await distributor.inventoryBalance()).to.equal(FUND_AMOUNT - CLAIM_AMOUNT);

    // 3. Admin drains remaining to treasury (vault)
    const remaining = FUND_AMOUNT - CLAIM_AMOUNT;
    await distributor.connect(admin).drainToTreasury();
    expect(await distributor.inventoryBalance()).to.equal(0);

    // The vault now holds the drained amount
    expect(await vault.balance()).to.equal(remaining);

    // 4. Admin emergency-withdraws from vault
    const adminBefore = await sge.balanceOf(admin.address);
    await vault.connect(admin).emergencyWithdraw(admin.address);
    expect(await vault.balance()).to.equal(0);
    expect(await sge.balanceOf(admin.address)).to.equal(adminBefore + remaining);
  });

  it("vault.release works for authorized distributor address", async function () {
    const { vault, sge, admin, user1 } = await loadFixture(deployFullSystem);

    // Deposit some SGE into vault
    const amount = ethers.parseEther("2000");
    await sge.connect(admin).approve(await vault.getAddress(), amount);
    await vault.connect(admin).deposit(amount);

    // Grant distributor role to admin (simulating a distributor contract)
    await vault.connect(admin).setDistributor(admin.address, true);

    // Release from vault
    await vault.connect(admin).release(user1.address, amount);
    expect(await sge.balanceOf(user1.address)).to.equal(amount);
    expect(await vault.balance()).to.equal(0);
  });
});
