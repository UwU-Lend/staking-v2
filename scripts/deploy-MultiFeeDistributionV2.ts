import { MultiFeeDistributionV2, MultiFeeDistributionV2__factory } from "../typechain-types";

import distributorABI from '../abis/MultiFeeDistribution.json';
import { ethers } from "hardhat";

async function main() {
  const distributorAddress = '0x7c0bF1108935e7105E218BBB4f670E5942c5e237';
  const distributorV1 = new ethers.Contract(distributorAddress, distributorABI, ethers.provider);
  const stakingTokenAddress: string = await distributorV1.stakingToken();
  const rewardTokenAddress: string = await distributorV1.rewardToken();
  const rewardTokenVaultAddress: string = await distributorV1.rewardTokenVault();

  const DistributorV2: MultiFeeDistributionV2__factory = await ethers.getContractFactory('MultiFeeDistributionV2');
  const distributorV2: MultiFeeDistributionV2 = await DistributorV2.deploy(stakingTokenAddress, rewardTokenAddress, rewardTokenVaultAddress);

  console.log(`MultiFeeDistributionV2 deploying in tx ${distributorV2.deployTransaction.hash}`);
  await distributorV2.deployed();
  console.log(`MultiFeeDistributionV2 deployed at ${distributorV2.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
