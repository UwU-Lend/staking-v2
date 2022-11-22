import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { Migration } from "../typechain-types";
import { ethers } from "hardhat";
import { expect } from "chai";
import { migrationFixture } from "./fixtures/migration.fixture";
import { migrationWithBalancesFixture } from "./fixtures/migration-with-balances.fixture";

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
      const balances: Migration.BalanceStruct[] = [{
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
      const balances: Migration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setBalances(account1.address, balances);
      await migration.setBalances(account2.address, balances);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(100));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(100));
    });
    it("Should be the right set accounts", async () => {
      const {migration} = await loadFixture(migrationFixture);
      const [, account1, account2] = await ethers.getSigners();
      const latest: number = await time.latest();
      const balances: Migration.BalanceStruct[] = [{
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
      const balances1: Migration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 5,
      }];
      const balances2: Migration.BalanceStruct[] = [{
        amount: 300,
        validUntil: latest + 86400 * 5,
      }, {
        amount: 400,
        validUntil: latest + 86400 * 5,
      }];
      await migration.setBalances(account1.address, balances1);
      await migration.setBalances(account2.address, balances2);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(300));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(700));
    });
  });
  describe("RemoveBalances", () => {
    it("Only the owner can be call method", async () => {
      const {migration} = await loadFixture(migrationWithBalancesFixture);
      const [deployer, caller, account1] = await ethers.getSigners();
      await expect(migration.connect(caller).removeBalances(account1.address)).to.be.reverted;
      await expect(migration.connect(deployer).removeBalances(account1.address)).to.be.not.reverted;
    });
    it("Should be able to remove balances", async () => {
      const {migration} = await loadFixture(migrationWithBalancesFixture);
      const [, account1, account2] = await ethers.getSigners();
      await migration.removeBalances(account1.address);
      await migration.removeBalances(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(0));
    });
    it("Should be the right remove accounts", async () => {
      const {migration} = await loadFixture(migrationWithBalancesFixture);
      const [, account1, account2] = await ethers.getSigners();
      await migration.removeBalances(account1.address);
      expect(await migration.accountsLength()).to.be.equals(BigNumber.from(1));
      expect(await migration.accounts(0)).to.be.equals(account2.address);
    });
    it("Should be the right remaining balances (zero)", async () => {
      const {migration} = await loadFixture(migrationWithBalancesFixture);
      const [, account1, account2] = await ethers.getSigners();
      await migration.removeBalances(account1.address);
      await migration.removeBalances(account2.address);
      expect(await migration.balanceOf(account1.address)).to.be.equals(BigNumber.from(0));
      expect(await migration.balanceOf(account2.address)).to.be.equals(BigNumber.from(0));
    });
  });
});