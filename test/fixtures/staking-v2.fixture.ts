import { Contract } from 'ethers';
import { IERC20 } from '../../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import distributorABI from '../../abis/MultiFeeDistribution.json';
import { ethers } from 'hardhat';

export type StakingV2FixtureResult = {
  distributorV1: Contract;
  distributorV2: Contract;
  stakingToken: IERC20;
  stakingTokenHolder: SignerWithAddress;
  rewardToken: IERC20;
  rewardTokenHolder: SignerWithAddress;
  rewardTokenVaultAddress: string;
  uToken: IERC20;
  incentivesController: Contract;
}

export const stakingV2Fixture = async (): Promise<StakingV2FixtureResult> => {
  const distributorAddress = '0x7c0bF1108935e7105E218BBB4f670E5942c5e237';
  const incentivesControllerAddress = '0x21953192664867e19F85E96E1D1Dd79dc31cCcdB';
  const stakingTokenHolderAddress = '0x7c0bF1108935e7105E218BBB4f670E5942c5e237';
  const rewardTokenHolderAddress = '0xC671A6B1415dE6549B05775Ee4156074731190c6';

  const distributorV1 = new ethers.Contract(distributorAddress, distributorABI, ethers.provider);
  const stakingTokenAddress: string = await distributorV1.stakingToken();
  const rewardTokenAddress: string = await distributorV1.rewardToken();
  const rewardTokenVaultAddress: string = await distributorV1.rewardTokenVault();

  const stakingToken = await ethers.getContractAt('IERC20', stakingTokenAddress);
  await ethers.provider.send('hardhat_setBalance', [stakingTokenHolderAddress, ethers.utils.parseEther('1000').toHexString()]);
  const stakingTokenHolder = await ethers.getImpersonatedSigner(stakingTokenHolderAddress);

  const rewardToken = await ethers.getContractAt('IERC20', rewardTokenAddress);
  await ethers.provider.send('hardhat_setBalance', [rewardTokenHolderAddress, ethers.utils.parseEther('1000').toHexString()]);
  const rewardTokenHolder = await ethers.getImpersonatedSigner(rewardTokenHolderAddress);

  const DistributorV2 = await ethers.getContractFactory('MultiFeeDistributionV2');
  const distributorV2 = await DistributorV2.deploy(stakingTokenAddress, rewardTokenAddress, rewardTokenVaultAddress, distributorV1.address);

  const IncentivesController = await ethers.getContractFactory('IncentivesControllerMock');
  const incentivesController = await IncentivesController.deploy();

  await distributorV2.setIncentivesController(incentivesController.address);

  const UToken = await ethers.getContractFactory('UTokenMock');
  const uToken = await UToken.deploy(ethers.utils.parseEther("1000000")) as IERC20;

  return { distributorV1, distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenHolder, rewardTokenVaultAddress, uToken, incentivesController };
}