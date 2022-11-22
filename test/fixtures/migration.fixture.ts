import { Migration, Migration__factory } from "../../typechain-types";

import { ethers } from "hardhat";

export type MigrationFixtureResult = {
  migration: Migration;
};

export const migrationFixture = async (): Promise<MigrationFixtureResult> => {
  const Migration: Migration__factory = await ethers.getContractFactory('Migration');
  const migration: Migration = await Migration.deploy();
  return { migration };
};