import { IERC20, IncentivesControllerMock, IncentivesControllerMock__factory, Migration, MultiFeeDistributionV2, MultiFeeDistributionV2__factory } from '../../typechain-types';

import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import distributorABI from '../../abis/MultiFeeDistribution.json';
import { ethers } from 'hardhat';
import { migrationFixture } from './migration.fixture';

export type MultiFeeDistributionV2FixtureResult = {
  migration: Migration;
  distributorV2: MultiFeeDistributionV2;
  stakingToken: IERC20;
  stakingTokenHolder: SignerWithAddress;
  rewardToken: IERC20;
  rewardTokenHolder: SignerWithAddress;
  rewardTokenVaultAddress: string;
  uToken: IERC20;
  incentivesController: IncentivesControllerMock;
}

export const MultiFeeDistributionV2Fixture = async (): Promise<MultiFeeDistributionV2FixtureResult> => {
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

  const DistributorV2: MultiFeeDistributionV2__factory = await ethers.getContractFactory('MultiFeeDistributionV2');
  const distributorV2: MultiFeeDistributionV2 = await DistributorV2.deploy(stakingTokenAddress, rewardTokenAddress, rewardTokenVaultAddress);

  const IncentivesController: IncentivesControllerMock__factory = await ethers.getContractFactory('IncentivesControllerMock');
  const incentivesController: IncentivesControllerMock = await IncentivesController.deploy();

  const {migration} = await migrationFixture();

  // await distributorV2.setIncentivesController(incentivesController.address);
  // await distributorV2.setMigration(migration.address);

  const UToken = await ethers.getContractFactory('UTokenMock');
  const uToken = await UToken.deploy(ethers.utils.parseEther("1000000")) as IERC20;

  return {
    migration, distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenHolder,
    rewardTokenVaultAddress, uToken, incentivesController,
  };
}