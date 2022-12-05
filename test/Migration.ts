import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "@ethersproject/bignumber";
import { IMigration } from "../typechain-types/contracts/Migration.sol/Migration";
import { ethers } from "hardhat";
import { expect } from "chai";
import { migrationFixture } from "./fixtures/migration.fixture";

describe("Migration", () => {
  describe("Deployment", () => {
    it("Should be deployed", async () => {
      const {migration} = await loadFixture(migrationFixture);
      expect(migration.address).to.not.be.undefined;
    });
    it("Should be the right set owner", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [deployer] = await ethers.getSigners();
      const owner: string = await migration.owner();
      expect(owner).to.be.equals(deployer.address);
    });
  });
  describe("SetDistributor", () => {
    it("Only the owner can change the distributor", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [owner, notOwner, distributor] = await ethers.getSigners();
      await expect(migration.connect(notOwner).setDistributor(distributor.address)).to.be.reverted;
      await expect(migration.connect(owner).setDistributor(distributor.address)).to.be.not.reverted;
    });
    it("Should be able to set distributor", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [distributor] = await ethers.getSigners();
      const before: string = await migration.distributor();
      await migration.setDistributor(distributor.address);
      const after: string = await migration.distributor();
      expect(before).to.be.equals("0x0000000000000000000000000000000000000000");
      expect(before).to.not.be.equals(after);
      expect(after).to.be.equals(distributor.address);
    });
  });
  describe("SetUpdater", () => {
    it("Only the owner can change the updater", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [owner, notOwner, updater] = await ethers.getSigners();
      await expect(migration.connect(notOwner).setDistributor(updater.address)).to.be.reverted;
      await expect(migration.connect(owner).setDistributor(updater.address)).to.be.not.reverted;
    });
    it("Should be able to set updater", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeExpiredBalances(account1.address);
      await migration.removeExpiredBalances(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(600));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(1500));
      await time.increase(86400 * 2);
      await migration.removeExpiredBalances(account1.address);
      await migration.removeExpiredBalances(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(600));
    });
  });
  describe("Update", () => {
    it("Only the updater can update", async () => {
      const {migration, distributor} = await loadFixture(migrationFixture);
      const [updater, account1, account2] = await ethers.getSigners();
      await migration.setUpdater(updater.address);
      await migration.setDistributor(distributor.address);
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
  });
  describe("SetBalances", () => {
    it("Only the owner can set the balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [owner, notOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }];
      await expect(migration.connect(notOwner).setBalances(account.address, balances)).to.be.reverted;
      await expect(migration.connect(owner).setBalances(account.address, balances)).to.be.not.reverted;
    });
    it("Should be able to add balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(700));
    });
    it("Should be the right set accounts", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }];
      await migration.setBalancesBatch([account1.address, account2.address], [balances, balances]);
      const accountsLength: BigNumber = await migration.accountsLength();
      expect(accountsLength).to.be.equals(BigNumber.from(2));
    });
    it("Should be the right set balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(700));
    });
  });
  describe("RemoveBalances", () => {
    it("Only the owner can remove the balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalances(account.address, balances1);
      await expect(migration.connect(notOwner).removeBalances(account.address)).to.be.reverted;
      await expect(migration.connect(owner).removeBalances(account.address)).to.be.not.reverted;
    });
    it("Should be able to remove balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalances(account1.address);
      await migration.removeBalances(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(0));
    });
    it("Should be the right remove accounts", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalances(account1.address);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(1));
      expect(await migration.accounts(0)).to.be.equals(account2.address);
    });
  });
  describe("SetBalancesBatch", () => {
    it("Only the owner can set the balances batch", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [owner, nbotOwner, account] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await expect(migration.connect(nbotOwner).setBalancesBatch([account.address], [balances])).to.be.reverted;
      await expect(migration.connect(owner).setBalancesBatch([account.address], [balances])).to.be.not.reverted;
    });
    it("Should be able to add balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setBalancesBatch([account1.address, account2.address], [balances, balances]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(100));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(100));
    });
    it("Should be the right set accounts", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setBalancesBatch([account1.address, account2.address], [balances, balances]);
      const accountsLength: BigNumber = await migration.accountsLength();
      expect(accountsLength).to.be.equals(BigNumber.from(2));
    });
    it("Should be the right set balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(700));
    });
  });
  describe("RemoveBalancesBatch", () => {
    it("Only the owner can be remove balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalances(account.address, balances1);
      await expect(migration.connect(notOwner).removeBalancesBatch([account.address])).to.be.reverted;
      await expect(migration.connect(owner).removeBalancesBatch([account.address])).to.be.not.reverted;
    });
    it("Should be able to remove balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalancesBatch([account1.address, account2.address]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(0));
    });
    it("Should be the right remove accounts", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.removeBalancesBatch([account1.address]);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(1));
      expect(await migration.accounts(0)).to.be.equals(account2.address);
    });
  });
  describe("AccountsLength", () => {
    it("Should be the right accounts length", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(2));
    });
  });
  describe("BalanceOf", () => {
    it("Should be the right balance of account", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(600));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(1500));
    });
    it("Should be the right balance after remove expired balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await time.increase(86400 * 2);
      await migration.removeExpiredBalances(account1.address);
      await migration.removeExpiredBalances(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(600));
    });
  });
  describe("TotalSupply", () => {
    it("Should be the right total supply", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      const totalSupply: BigNumber = await migration.totalSupply();
      expect(totalSupply).to.be.equals(BigNumber.from(2100));
    });
    it("Should be the right total supply after remove expired balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
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
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await time.increase(86400 * 2);
      await migration.removeExpiredBalances(account1.address);
      await migration.removeExpiredBalances(account2.address);
      const totalSupply: BigNumber = await migration.totalSupply();
      expect(totalSupply).to.be.equals(BigNumber.from(900));
    });
  });
});