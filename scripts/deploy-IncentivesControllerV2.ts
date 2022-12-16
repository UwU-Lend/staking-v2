import { IncentivesControllerV2, IncentivesControllerV2__factory } from "../typechain-types";

import { ethers } from "hardhat";

const DISTRIBUTOR_V2_ADDRESS = "0x0000000000000000000000000000000000000000";
export const START_TIME_OFFSET = [
  '7776000', '10368000', '12960000', // 7776000 = 2022-12-18T17:30:59.000Z
  '15552000', '18144000', '20736000',
  '23328000', '25920000', '28512000',
  '31536000', '63072000', '94608000'
];
export const REWARDS_PER_SECOND = [
  '19290123456790120', '38580246913580240', '38580246913580240',
  '38580246913580240', '38580246913580240', '38580246913580240',
  '38580246913580240', '38580246913580240', '38580246913580240',
  '63419583967529170', '63419583967529170', '63419583967529170'
];
export const MAX_MINTABLE = '6975000000000000000000000';
export const POOL_CONFIGURATOR = '0x408c9764993209DC772eB12FF641F4b55F5b005C';
export const REWARD_TOKEN = '0x55C08ca52497e2f1534B59E2917BF524D4765257';
export const INCENTIVES_CONTROLLER = '0x21953192664867e19F85E96E1D1Dd79dc31cCcdB';


async function main() {
  const IncentivesControllerV2: IncentivesControllerV2__factory = await ethers.getContractFactory('IncentivesControllerV2');
  const controllerV2: IncentivesControllerV2 = await IncentivesControllerV2.deploy(START_TIME_OFFSET, REWARDS_PER_SECOND, POOL_CONFIGURATOR, DISTRIBUTOR_V2_ADDRESS, MAX_MINTABLE, INCENTIVES_CONTROLLER);
  console.log(`IncentivesControllerV2 deploying in tx ${controllerV2.deployTransaction.hash}`);
  await controllerV2.deployed();
  console.log(`IncentivesControllerV2 deployed at ${controllerV2.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
