import { Migration, MigrationUpdater, MigrationUpdater__factory } from "../typechain-types";

import { BigNumber } from "ethers";
import { ethers } from "hardhat";

async function main() {
  const migration: Migration = await ethers.getContractAt('Migration', '0x458E7e99344996548Fbc895cb5Ce3E08eC9A7e59');
  const balance: BigNumber = await migration.balanceOf('0xF862c0e523be3a8C97D3a587eD60E613613c9467');
  console.log('Balance', balance);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
