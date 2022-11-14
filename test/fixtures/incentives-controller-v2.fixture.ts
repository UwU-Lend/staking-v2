import { Contract } from 'ethers';
import { IERC20 } from '../../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import incentivesControllerABI from '../../abis/InsentivesController.json';

export const START_TIME_OFFSET = [
  '1', '2592000', '5184000',
  '7776000', '10368000', '12960000',
  '15552000', '18144000', '20736000',
  '23328000', '25920000', '28512000',
  '31536000', '63072000', '94608000'
];
export const REWARDS_PER_SECOND = [
  '9645061728395060', '19290123456790120', '19290123456790120',
  '19290123456790120', '38580246913580240', '38580246913580240',
  '38580246913580240', '38580246913580240', '38580246913580240',
  '38580246913580240', '38580246913580240', '38580246913580240',
  '63419583967529170', '63419583967529170', '63419583967529170'
];
export const MAX_MINTABLE = '6975000000000000000000000';
export const POOL_CONFIGURATOR = '0x408c9764993209DC772eB12FF641F4b55F5b005C';
export const REWARD_TOKEN = '0x55C08ca52497e2f1534B59E2917BF524D4765257';
export const INCENTIVES_CONTROLLER = '0x21953192664867e19F85E96E1D1Dd79dc31cCcdB';

export type IncentivesControllerV2FixtureResult = {
  controllerV1: Contract;
  controllerV2: Contract;
  distributor: Contract;
  rewardToken: IERC20;
  rewardTokenHolder: SignerWithAddress;
}

export const incentivesController2Fixture = async (): Promise<IncentivesControllerV2FixtureResult> => {
  const rewardTokenHolderAddress = '0xC671A6B1415dE6549B05775Ee4156074731190c6';

  const rewardToken = await ethers.getContractAt('IERC20', REWARD_TOKEN);
  await ethers.provider.send('hardhat_setBalance', [rewardTokenHolderAddress, ethers.utils.parseEther('1000').toHexString()]);
  const rewardTokenHolder = await ethers.getImpersonatedSigner(rewardTokenHolderAddress);

  const Distributor = await ethers.getContractFactory('MultiFeeDistributionMock');
  const distributor = await Distributor.deploy(rewardToken.address);

  const controllerV1 = new ethers.Contract(INCENTIVES_CONTROLLER, incentivesControllerABI, ethers.provider);

  const IncentivesControllerV2 = await ethers.getContractFactory('IncentivesControllerV2');
  const controllerV2 = await IncentivesControllerV2.deploy(START_TIME_OFFSET, REWARDS_PER_SECOND, POOL_CONFIGURATOR, distributor.address, MAX_MINTABLE, controllerV1.address);

  return { distributor, rewardToken, rewardTokenHolder, controllerV1, controllerV2 };
}