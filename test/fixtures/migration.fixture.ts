import { Migration, Migration__factory, MultiFeeDistributionMock, MultiFeeDistributionMock__factory } from "../../typechain-types";

import { ethers } from "hardhat";

export type MigrationFixtureResult = {
  migration: Migration;
  distributor: MultiFeeDistributionMock;
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const migrationFixture = async (): Promise<MigrationFixtureResult> => {
  const Migration: Migration__factory = await ethers.getContractFactory('Migration');
  const migration: Migration = await Migration.deploy();
  const Distributor: MultiFeeDistributionMock__factory = await ethers.getContractFactory('MultiFeeDistributionMock');
  const distributor: MultiFeeDistributionMock = await Distributor.deploy(ZERO_ADDRESS);
  return { migration, distributor };
};