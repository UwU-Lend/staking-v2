import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "@ethersproject/bignumber";
import { IMigration } from "../typechain-types/contracts/Migration.sol/Migration";
import { Migration } from "../typechain-types";
import { MultiFeeDistributionV2Fixture } from "./fixtures/multi-fee-distribution-v2.fixture";
import balancesBatchEntries from "../balances-batch-entries.json";
import { ethers } from "hardhat";
import { expect } from "chai";
import { migrationFixture } from "./fixtures/migration.fixture";

describe("Migration", () => {
  describe("Deployment", () => {
    it("Should be deployed", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      expect(migration.address).to.not.be.undefined;
    });
    it("Should be the right set owner", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [deployer] = await ethers.getSigners();
      const owner: string = await migration.owner();
      expect(owner).to.be.equals(deployer.address);
    });
  });
  describe("SetDistributor", () => {
    it("Only the owner can change the distributor", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner] = await ethers.getSigners();
      await expect(migration.connect(notOwner).setDistributor(distributorV2.address)).to.be.reverted;
      await expect(migration.connect(owner).setDistributor(distributorV2.address)).to.be.not.reverted;
    });
    it("Should be able to set distributor", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const before: string = await migration.distributor();
      await migration.setDistributor(distributorV2.address);
      const after: string = await migration.distributor();
      expect(before).to.be.equals("0x0000000000000000000000000000000000000000");
      expect(before).to.not.be.equals(after);
      expect(after).to.be.equals(distributorV2.address);
    });
  });
  describe("SetUpdater", () => {
    it("Only the owner can change the updater", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner, updater] = await ethers.getSigners();
      await expect(migration.connect(notOwner).setDistributor(updater.address)).to.be.reverted;
      await expect(migration.connect(owner).setDistributor(updater.address)).to.be.not.reverted;
    });
    it("Should be able to set updater", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [updater] = await ethers.getSigners();
      const before: string = await migration.updater();
      await migration.setUpdater(updater.address);
      const after: string = await migration.updater();
      expect(before).to.be.equals("0x0000000000000000000000000000000000000000");
      expect(before).to.not.be.equals(after);
      expect(after).to.be.equals(updater.address);
    });
  });
  describe("RemoveExpiredBalances", () => {
    it("Should be able remove balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2, updater] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await distributorV2.setMigration(migration.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.setUpdater(updater.address);
      await migration.connect(updater).update(account1.address);
      await migration.connect(updater).update(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(600));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(1500));
      await time.increase(86400 * 2);
      await migration.connect(updater).update(account1.address);
      await migration.connect(updater).update(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(600));
    });
    it("Should be work with real data", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, updater] = await ethers.getSigners();
      await migration.setDistributor(distributorV2.address);
      await migration.setUpdater(updater.address);
      await distributorV2.setMigration(migration.address);
      for (const balancesBatch of balancesBatchEntries) {
        const batch = balancesBatch.map(([account, amount, validUntil]) => ({ account, amount, validUntil }));
        await migration.addBalancesBatch(batch);
      }
      await time.increaseTo(1671062400);
      await migration.connect(updater).update('0xF862c0e523be3a8C97D3a587eD60E613613c9467');
      expect(await migration.balanceOf('0xF862c0e523be3a8C97D3a587eD60E613613c9467')).to.be.equals('1152148500000000000');
    });
  });
  describe("Update", () => {
    it("Only the updater can update", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [updater, account1, account2] = await ethers.getSigners();
      await distributorV2.setMigration(migration.address);
      await migration.setUpdater(updater.address);
      await migration.setDistributor(distributorV2.address);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await time.increase(86400 * 2);
      await migration.connect(updater).update(account1.address);
      await migration.connect(updater).update(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(600));
    });
    // it("Should be has no effect after call method twice", async () => {
  });
  describe("SetBalances", () => {
    it("Only the owner can set the balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }];
      await migration.setDistributor(distributorV2.address);
      await expect(migration.connect(notOwner).setBalances(account.address, balances)).to.be.reverted;
      await expect(migration.connect(owner).setBalances(account.address, balances)).to.be.not.reverted;
    });
    it("Should be able to add balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 300,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 400,
        validUntil: latest + 86400 * 2,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(700));
    });
    it("Should be the right set accounts", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances, balances]);
      const accountsLength: BigNumber = await migration.accountsLength();
      expect(accountsLength).to.be.equals(BigNumber.from(2));
    });
    it("Should be the right set balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 300,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 400,
        validUntil: latest + 86400 * 2,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(700));
    });
  });
  describe("RemoveBalances", () => {
    it("Only the owner can remove the balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalances(account.address, balances1);
      await expect(migration.connect(notOwner).removeBalances(account.address)).to.be.reverted;
      await expect(migration.connect(owner).removeBalances(account.address)).to.be.not.reverted;
    });
    it("Should be able to remove balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalances(account1.address);
      await migration.removeBalances(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(0));
    });
    it("Should be the right remove accounts", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalances(account1.address);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(1));
      expect(await migration.accounts(0)).to.be.equals(account2.address);
    });
  });
  describe("SetBalancesBatch", () => {
    it("Only the owner can set the balances batch", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setDistributor(distributorV2.address);
      await expect(migration.connect(notOwner).setBalancesBatch([account.address], [balances])).to.be.reverted;
      await expect(migration.connect(owner).setBalancesBatch([account.address], [balances])).to.be.not.reverted;
    });
    it("Should be able to add balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances, balances]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(100));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(100));
    });
    it("Should be the right set accounts", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances, balances]);
      const accountsLength: BigNumber = await migration.accountsLength();
      expect(accountsLength).to.be.equals(BigNumber.from(2));
    });
    it("Should be the right set balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 5,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 300,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 400,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(700));
    });
  });
  describe("AddBalancesBatch", () => {
    it("Only the owner can added the balances batch", async () => {
      const {migration, distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const batch: Migration.BalanceWithAccountStruct[] = [
        { account: account.address, amount: 100, validUntil: latest + 86400 * 1 },
        { account: account.address, amount: 200, validUntil: latest + 86400 * 2 },
      ];
      await migration.setDistributor(distributorV2.address);
      await expect(migration.connect(notOwner).addBalancesBatch(batch)).to.be.reverted;
      await expect(migration.connect(owner).addBalancesBatch(batch)).to.be.not.reverted;
    });
    it("Should be the right set accounts", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const batch: Migration.BalanceWithAccountStruct[] = [
        { account: account1.address, amount: 100, validUntil: latest + 86400 * 1 },
        { account: account1.address, amount: 200, validUntil: latest + 86400 * 2 },
        { account: account2.address, amount: 300, validUntil: latest + 86400 * 1 },
        { account: account2.address, amount: 400, validUntil: latest + 86400 * 2 },
      ];
      await migration.setDistributor(distributorV2.address);
      await migration.addBalancesBatch(batch);
      expect(await migration.accountsLength()).to.be.equals(2);
    });
    it("Should be the right set balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const batch: Migration.BalanceWithAccountStruct[] = [
        { account: account1.address, amount: 100, validUntil: latest + 86400 * 1 },
        { account: account1.address, amount: 200, validUntil: latest + 86400 * 2 },
        { account: account2.address, amount: 300, validUntil: latest + 86400 * 1 },
        { account: account2.address, amount: 400, validUntil: latest + 86400 * 2 },
      ];
      await migration.setDistributor(distributorV2.address);
      await migration.addBalancesBatch(batch);
      expect(await migration.balanceOf(account1.address)).to.be.equals(300);
      expect(await migration.balanceOf(account2.address)).to.be.equals(700);
    });
  });
  describe("RemoveAllBalances", () => {
    it("Only the owner can remove all balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const batch: Migration.BalanceWithAccountStruct[] = [
        { account: account.address, amount: 100, validUntil: latest + 86400 * 1 },
        { account: account.address, amount: 200, validUntil: latest + 86400 * 2 },
      ];
      await migration.setDistributor(distributorV2.address);
      await migration.addBalancesBatch(batch);
      await expect(migration.connect(notOwner).removeAllBalances()).to.be.reverted;
      await expect(migration.connect(owner).removeAllBalances()).to.be.not.reverted;
    });
    it("Should be remove all accounts", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const batch: Migration.BalanceWithAccountStruct[] = [
        { account: account1.address, amount: 100, validUntil: latest + 86400 * 1 },
        { account: account1.address, amount: 200, validUntil: latest + 86400 * 2 },
        { account: account2.address, amount: 300, validUntil: latest + 86400 * 1 },
        { account: account2.address, amount: 400, validUntil: latest + 86400 * 2 },
      ];
      await migration.setDistributor(distributorV2.address);
      await migration.addBalancesBatch(batch);
      expect(await migration.accountsLength()).to.be.equals(2);
      await migration.removeAllBalances();
      expect(await migration.accountsLength()).to.be.equals(0);
    });
    it("Should be able remove all balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const batch: Migration.BalanceWithAccountStruct[] = [
        { account: account1.address, amount: 100, validUntil: latest + 86400 * 1 },
        { account: account1.address, amount: 200, validUntil: latest + 86400 * 2 },
        { account: account2.address, amount: 300, validUntil: latest + 86400 * 1 },
        { account: account2.address, amount: 400, validUntil: latest + 86400 * 2 },
      ];
      await migration.setDistributor(distributorV2.address);
      await migration.addBalancesBatch(batch);
      expect(await migration.totalSupply()).to.be.equals(1000);
      await migration.removeAllBalances();
      expect(await migration.totalSupply()).to.be.equals(0);
    });
  });
  describe("RemoveBalancesBatch", () => {
    it("Only the owner can be remove balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [owner, notOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalances(account.address, balances1);
      await expect(migration.connect(notOwner).removeBalancesBatch([account.address])).to.be.reverted;
      await expect(migration.connect(owner).removeBalancesBatch([account.address])).to.be.not.reverted;
    });
    it("Should be able to remove balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 5,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalancesBatch([account1.address, account2.address]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(0));
    });
    it("Should be the right remove accounts", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 5,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalancesBatch([account1.address]);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(1));
      expect(await migration.accounts(0)).to.be.equals(account2.address);
    });
  });
  describe("AccountsLength", () => {
    it("Should be the right accounts length", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(2));
    });
  });
  describe("BalanceOf", () => {
    it("Should be the right balance of account", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(600));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(1500));
    });
    it("Should be the right balance after remove expired balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2, updater] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await distributorV2.setMigration(migration.address);
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.setUpdater(updater.address);
      await time.increase(86400 * 2);
      await migration.connect(updater).update(account1.address);
      await migration.connect(updater).update(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(600));
    });
    it("Should be the right balance with real balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2, updater] = await ethers.getSigners();
      await distributorV2.setMigration(migration.address);
      await migration.setDistributor(distributorV2.address);
      await migration.setUpdater(updater.address);
      for (const balancesBatch of balancesBatchEntries) {
        const batch = balancesBatch.map(([account, amount, validUntil]) => ({ account, amount, validUntil }));
        await migration.addBalancesBatch(batch);
      }
      await time.increaseTo(1671062400);
      await migration.connect(updater).update('0xF862c0e523be3a8C97D3a587eD60E613613c9467');
      expect(await migration.balanceOf('0xF862c0e523be3a8C97D3a587eD60E613613c9467')).to.be.equals('1152148500000000000');
    });
  });
  describe("TotalSupply", () => {
    it("Should be the right total supply", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      const totalSupply: BigNumber = await migration.totalSupply();
      expect(totalSupply).to.be.equals(BigNumber.from(2100));
    });
    it("Should be the right total supply after remove expired balances", async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [account1, account2, updater] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await distributorV2.setMigration(migration.address);
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.setUpdater(updater.address);
      await time.increase(86400 * 2);
      await migration.connect(updater).update(account1.address);
      await migration.connect(updater).update(account2.address);
      const totalSupply: BigNumber = await migration.totalSupply();
      expect(totalSupply).to.be.equals(BigNumber.from(900));
    });
    it("Should be the right total supply with real balances",async () => {
      const {migration, distributorV2} = await loadFixture(MultiFeeDistributionV2Fixture);
      const [updater] = await ethers.getSigners();
      await distributorV2.setMigration(migration.address);
      await migration.setDistributor(distributorV2.address);
      await migration.setUpdater(updater.address);
      let total: BigNumber = BigNumber.from(0);
      for (const balancesBatch of balancesBatchEntries) {
        const batch = balancesBatch.map(([account, amount, validUntil]) => ({ account, amount, validUntil }));
        await migration.addBalancesBatch(batch);
        total = total.add(batch.reduce((acc: BigNumber, { amount }) => acc.add(BigNumber.from(amount)), BigNumber.from(0)));
      }
      const totalSupply: BigNumber = await migration.totalSupply();
      expect(totalSupply).to.be.equals(total);
    });
  });
});