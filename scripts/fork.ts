import { MultiFeeDistributionV2Fixture } from "../test/fixtures/multi-fee-distribution-v2.fixture";
import { ethers } from "hardhat";

async function main() {
  const {migration, distributorV2, incentivesController } = await MultiFeeDistributionV2Fixture();
  await ethers.provider.send("hardhat_setBalance", ["0x7a23Fd7C8C28e905a8F7E713c42aE63364c78639", ethers.utils.parseEther('1000').toHexString()]);
  await migration.setUpdater('0x7a23Fd7C8C28e905a8F7E713c42aE63364c78639');
  console.log(`Migration address: ${migration.address}`);
  console.log(`DistributorV2 address: ${distributorV2.address}`);
  console.log(`IncentivesController address: ${incentivesController.address}`);

  // 0x50831130c4B0aa78fCA9EDAA39D7339A9620d751

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
