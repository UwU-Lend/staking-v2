import { Migration, Migration__factory } from "../../typechain-types";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

export type MigrationWithBalancesFixtureResult = {
  migration: Migration;
};

export const migrationWithBalancesFixture = async (): Promise<MigrationWithBalancesFixtureResult> => {
  const Migration: Migration__factory = await ethers.getContractFactory('Migration');
  const migration: Migration = await Migration.deploy();

  const [, account1, account2] = await ethers.getSigners();

  const latest: number = await time.latest();

  const balances1: Migration.BalanceStruct[] = [{
    amount: 100,
    validUntil: latest + 86400 * 5,
  }, {
    amount: 200,
    validUntil: latest + 86400 * 5,
  }, {
    amount: 300,
    validUntil: latest + 86400 * 5,
  }];
  const balances2: Migration.BalanceStruct[] = [{
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
  return { migration };
};