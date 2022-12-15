import { Migration, Migration__factory, MultiFeeDistributionMock, MultiFeeDistributionMock__factory, MultiFeeDistributionV2, MultiFeeDistributionV2__factory } from "../../typechain-types";

import distributorABI from '../../abis/MultiFeeDistribution.json';
import { ethers } from "hardhat";

export type MigrationFixtureResult = {
  migration: Migration;
  distributor: MultiFeeDistributionV2;
};

export const migrationFixture = async (): Promise<MigrationFixtureResult> => {
  const distributorAddress = '0x7c0bF1108935e7105E218BBB4f670E5942c5e237';

  const distributorV1 = new ethers.Contract(distributorAddress, distributorABI, ethers.provider);
  const stakingTokenAddress: string = await distributorV1.stakingToken();
  const rewardTokenAddress: string = await distributorV1.rewardToken();
  const rewardTokenVaultAddress: string = await distributorV1.rewardTokenVault();

  const Migration: Migration__factory = await ethers.getContractFactory('Migration');
  const migration: Migration = await Migration.deploy();

  const Distributor: MultiFeeDistributionV2__factory = await ethers.getContractFactory('MultiFeeDistributionV2');
  const distributor: MultiFeeDistributionV2 = await Distributor.deploy(stakingTokenAddress, rewardTokenAddress, rewardTokenVaultAddress)

  // for (const balancesBatch of balancesBatchEntries) {
  //   const batch = balancesBatch.map(([account, amount, validUntil]) => ({ account, amount, validUntil }));
  //   await migration.addBalancesBatch(batch);
  // }
  return { migration, distributor };
};