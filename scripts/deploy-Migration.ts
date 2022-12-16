import { Migration, Migration__factory } from "../typechain-types";

import { ethers } from "hardhat";

async function main() {
  const Migration: Migration__factory = await ethers.getContractFactory('Migration');
  const migration: Migration = await Migration.deploy();
  console.log(`Migration deploying in tx ${migration.deployTransaction.hash}`);
  await migration.deployed();
  console.log(`Migration deployed at ${migration.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
