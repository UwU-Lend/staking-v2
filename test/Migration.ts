import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "@ethersproject/bignumber";
import { IMigration } from "../typechain-types";
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
  describe("SetBalances", () => {
    it("Only the owner can be call method", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [deployer, caller, account1] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await expect(migration.connect(caller).setBalances(account1.address, balances)).to.be.reverted;
      await expect(migration.connect(deployer).setBalances(account1.address, balances)).to.be.not.reverted;
    });
    it("Should be able to add balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setBalances(account1.address, balances);
      await migration.setBalances(account2.address, balances);
      expect(await migration['balanceOf(address)'](account1.address)).to.be.equals(BigNumber.from(100));
      expect(await migration['balanceOf(address)'](account2.address)).to.be.equals(BigNumber.from(100));
    });
    it("Should be the right set accounts", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setBalances(account1.address, balances);
      await migration.setBalances(account2.address, balances);
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      expect(await migration['balanceOf(address)'](account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration['balanceOf(address)'](account2.address)).to.be.equals(BigNumber.from(700));
    });
  });
  describe("RemoveBalances", () => {
    it("Only the owner can be call method", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [deployer, caller, account1] = await ethers.getSigners();
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
      await migration.setBalances(account1.address, balances1);
      await expect(migration.connect(caller).removeBalances(account1.address)).to.be.reverted;
      await expect(migration.connect(deployer).removeBalances(account1.address)).to.be.not.reverted;
    });
    it("Should be able to remove balances", async () => {
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      await migration.removeBalances(account1.address);
      await migration.removeBalances(account2.address);
      expect(await migration['balanceOf(address)'](account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration['balanceOf(address)'](account2.address)).to.be.equals(BigNumber.from(0));
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      await migration.removeBalances(account1.address);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(1));
      expect(await migration.accounts(0)).to.be.equals(account2.address);
    });
  });
  describe("SetBalancesBatch", () => {
    it("Only the owner can be call method", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [deployer, caller, account1] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await expect(migration.connect(caller).setBalancesBatch([account1.address], [balances])).to.be.reverted;
      await expect(migration.connect(deployer).setBalancesBatch([account1.address], [balances])).to.be.not.reverted;
    });
    it("Should be able to add balances", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setBalancesBatch([account1.address, account2.address], [balances, balances]);
      expect(await migration['balanceOf(address)'](account1.address)).to.be.equals(BigNumber.from(100));
      expect(await migration['balanceOf(address)'](account2.address)).to.be.equals(BigNumber.from(100));
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
      expect(await migration['balanceOf(address)'](account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration['balanceOf(address)'](account2.address)).to.be.equals(BigNumber.from(700));
    });
  });
  describe("RemoveBalancesBatch", () => {
    it("Only the owner can be call method", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [deployer, caller, account1] = await ethers.getSigners();
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
      await migration.setBalances(account1.address, balances1);
      await expect(migration.connect(caller).removeBalancesBatch([account1.address])).to.be.reverted;
      await expect(migration.connect(deployer).removeBalancesBatch([account1.address])).to.be.not.reverted;
    });
    it("Should be able to remove balances", async () => {
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      await migration.removeBalancesBatch([account1.address, account2.address]);
      expect(await migration['balanceOf(address)'](account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration['balanceOf(address)'](account2.address)).to.be.equals(BigNumber.from(0));
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(2));
    });
  });
  describe("BalanceOf", () => {
    it("Should be the right balance of account by signature balanceOf(address)", async () => {
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      expect(await migration['balanceOf(address)'](account1.address)).to.be.equals(BigNumber.from(600));
      expect(await migration['balanceOf(address)'](account2.address)).to.be.equals(BigNumber.from(1500));
    });
    it("Should be the right balance of account by signature balanceOf(address,uint256)", async () => {
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      expect(await migration['balanceOf(address,uint256)'](account1.address, balances1[0].validUntil)).to.be.equals(BigNumber.from(600));
      expect(await migration['balanceOf(address,uint256)'](account1.address, balances1[1].validUntil)).to.be.equals(BigNumber.from(500));
      expect(await migration['balanceOf(address,uint256)'](account1.address, balances1[2].validUntil)).to.be.equals(BigNumber.from(300));
      expect(await migration['balanceOf(address,uint256)'](account1.address, latest + 86400 * 365)).to.be.equals(BigNumber.from(0));
      expect(await migration['balanceOf(address,uint256)'](account2.address, balances2[0].validUntil)).to.be.equals(BigNumber.from(1500));
      expect(await migration['balanceOf(address,uint256)'](account2.address, balances2[1].validUntil)).to.be.equals(BigNumber.from(1100));
      expect(await migration['balanceOf(address,uint256)'](account2.address, balances2[2].validUntil)).to.be.equals(BigNumber.from(600));
      expect(await migration['balanceOf(address,uint256)'](account2.address, latest + 86400 * 365)).to.be.equals(BigNumber.from(0));

    });
  });
  describe("TotalSupply", () => {
    it("Should be the right total supply by signature totalSupply()", async () => {
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      expect(await migration['totalSupply()']()).to.be.equals(BigNumber.from(2100));
    });
    it("Should be the right total supply by signature totalSupply(uint256)", async () => {
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
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);

      expect(await migration['totalSupply(uint256)'](balances1[0].validUntil)).to.be.equals(BigNumber.from(2100));
      expect(await migration['totalSupply(uint256)'](balances1[1].validUntil)).to.be.equals(BigNumber.from(1600));
      expect(await migration['totalSupply(uint256)'](balances1[2].validUntil)).to.be.equals(BigNumber.from(900));
      expect(await migration['totalSupply(uint256)'](latest + 86400 * 365)).to.be.equals(BigNumber.from(0));
    });
  });
});