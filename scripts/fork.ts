import { MultiFeeDistributionV2Fixture } from "../test/fixtures/multi-fee-distribution-v2.fixture";
import { ethers } from "hardhat";

async function main() {
  const {migration, distributorV2 } = await MultiFeeDistributionV2Fixture();
  await ethers.provider.send("hardhat_setBalance", ["0x7a23Fd7C8C28e905a8F7E713c42aE63364c78639", ethers.utils.parseEther('1000').toHexString()]);
  await migration.setUpdater('0x7a23Fd7C8C28e905a8F7E713c42aE63364c78639');
  console.log(`Migration address: ${migration.address}`);
  console.log(`DistributorV2 address: ${distributorV2.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
