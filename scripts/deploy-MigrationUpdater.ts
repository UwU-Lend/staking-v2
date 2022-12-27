import { MigrationUpdater, MigrationUpdater__factory } from "../typechain-types";

import { ethers } from "hardhat";

async function main() {
  const MigrationUpdater: MigrationUpdater__factory = await ethers.getContractFactory('MigrationUpdater');
  const migrationUpdater: MigrationUpdater = await MigrationUpdater.deploy();
  console.log(`MigrationUpdater deploying in tx ${migrationUpdater.deployTransaction.hash}`);
  await migrationUpdater.deployed();
  console.log(`MigrationUpdater deployed at ${migrationUpdater.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
