import { INCENTIVES_CONTROLLER, MAX_MINTABLE, POOL_CONFIGURATOR, REWARDS_PER_SECOND, START_TIME_OFFSET, incentivesController2Fixture } from "./fixtures/incentives-controller-v2.fixture";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

type PoolInfo = {
  totalSupply: BigNumber;
  lastRewardTime: BigNumber;
  accRewardPerShare: BigNumber;
  allocPoint: BigNumber;
}

type UserInfo = {
  amount: BigNumber;
  rewardDebt: BigNumber;
}

const calcClaimableReward = (poolInfo: PoolInfo, userInfo: UserInfo, rewardsPerSecond: BigNumber, totalAllocPoint: BigNumber, blockTimestamp: BigNumber ): BigNumber => {
  let accRewardPerShare = poolInfo.accRewardPerShare;
  const lpSupply = poolInfo.totalSupply;
  if (blockTimestamp.gt(poolInfo.lastRewardTime) && lpSupply.toString() != '0') {
    const duration = blockTimestamp.sub(poolInfo.lastRewardTime);
    const reward = duration.mul(rewardsPerSecond).mul(poolInfo.allocPoint).div(totalAllocPoint);
    accRewardPerShare = accRewardPerShare.add(reward.mul(BigNumber.from(10).pow(12)).div(lpSupply));
  }
  return userInfo.amount.mul(accRewardPerShare).div(BigNumber.from(10).pow(12)).sub(userInfo.rewardDebt);
}

describe("IncentivesControllerV2", () => {
  // describe("Deployment", () => {
  //   it("Should be the right set max mintable tokens", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const maxMintable: BigNumber = await controllerV2.maxMintableTokens();
  //     expect(maxMintable).to.be.equal(BigNumber.from(MAX_MINTABLE));
  //   });
  //   it("Sould be the right set pool configurator", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const poolConfigurator: string = await controllerV2.poolConfigurator();
  //     expect(poolConfigurator).to.be.equal(POOL_CONFIGURATOR);
  //   });
  //   it("Sould be the right set reward minter", async () => {
  //     const { controllerV2, distributor } = await loadFixture(incentivesController2Fixture);
  //     const rewardMinter: string = await controllerV2.rewardMinter();
  //     expect(rewardMinter).to.be.equal(distributor.address);
  //   });
  //   it("Sould be the right set emission schedule", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const length = START_TIME_OFFSET.length;
  //     for (let i = length; i > 0 ; i--) {
  //       const emissionSchedule: { startTimeOffset: BigNumber; rewardsPerSecond: BigNumber } = await controllerV2.emissionSchedule(length - i);
  //       expect(emissionSchedule.startTimeOffset).to.be.equal(BigNumber.from(START_TIME_OFFSET[i - 1]));
  //       expect(emissionSchedule.rewardsPerSecond).to.be.equal(BigNumber.from(REWARDS_PER_SECOND[i - 1]));
  //     }
  //     expect(controllerV2.emissionSchedule(length)).to.be.reverted;
  //   });
  //   it("Sould be the right set incentives controller", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const incentivesController: string = await controllerV2.incentivesController();
  //     expect(incentivesController).to.be.equal(INCENTIVES_CONTROLLER);
  //   });
  // });
  // describe("Setup", () => {
  //   it("Should be the right set initial properties", async () => {
  //     const { controllerV1, controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     await controllerV2.setup();
  //     const startTime1: BigNumber = await controllerV1.startTime();
  //     const startTime2: BigNumber = await controllerV2.startTime();
  //     const poolLength1: BigNumber = await controllerV1.poolLength();
  //     const poolLength2: BigNumber = await controllerV2.poolLength();
  //     expect(startTime1).to.be.equal(startTime2);
  //     expect(poolLength1).to.be.equal(poolLength2);
  //     let totalAllocPoint: BigNumber = BigNumber.from(0);
  //     for (let i = 0; i < poolLength1.toNumber(); i++) {
  //       const registeredToken1: string = await controllerV1.registeredTokens(i);
  //       const registeredToken2: string = await controllerV2.registeredTokens(i);
  //       expect(registeredToken1).to.be.equal(registeredToken2);
  //       const poolInfo1 = await controllerV1.poolInfo(registeredToken1);
  //       const poolInfo2 = await controllerV2.poolInfo(registeredToken2);
  //       expect(poolInfo1.totalSupply).to.be.equal(poolInfo2.totalSupply);
  //       expect(poolInfo1.allocPoint).to.be.equal(poolInfo2.allocPoint);
  //       expect(poolInfo1.lastRewardTime).to.be.equal(poolInfo2.lastRewardTime);
  //       expect(poolInfo1.accRewardPerShare).to.be.equal(poolInfo2.accRewardPerShare);
  //       expect(poolInfo1.onwardIncentives).to.be.equal(poolInfo2.onwardIncentives);
  //       totalAllocPoint = totalAllocPoint.add(poolInfo1.allocPoint);
  //     }
  //     const rewardsPerSecond1: BigNumber = await controllerV1.rewardsPerSecond();
  //     const rewardsPerSecond2: BigNumber = await controllerV2.rewardsPerSecond();
  //     expect(rewardsPerSecond1).to.be.equal(rewardsPerSecond2);
  //     expect(await controllerV2.totalAllocPoint()).to.be.equal(totalAllocPoint);
  //     const mintedTokens1 = await controllerV1.mintedTokens();
  //     const mintedTokens2 = await controllerV2.mintedTokens();
  //     expect(mintedTokens1).to.be.equal(mintedTokens2);
  //   });
  // });
  // describe("UserInfo", () => {
  //   it("Sould be receive data from v1 (before handle action)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await controllerV2.setup();
  //     const userInfo1 = await controllerV1.userInfo(token.address, user1.address);
  //     const userInfo2 = await controllerV2.userInfo(token.address, user1.address);
  //     expect(userInfo1.amount).to.be.equal(userInfo2.amount);
  //     expect(userInfo1.rewardDebt).to.be.equal(userInfo2.rewardDebt);
  //   });
  //   it("Sould be receive data from v2 (after handle action)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei1: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     const balanceInWei2: BigNumber = BigNumber.from(10).pow(18).mul(2000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei1, balanceInWei1.add(totalSupply));
  //     await controllerV2.setup();
  //     await controllerV2.connect(tokenSigner).handleAction(user1.address, balanceInWei2, balanceInWei1.add(balanceInWei2).add(totalSupply));
  //     const poolInfo = await controllerV2.poolInfo(token.address);
  //     const rewardDebt: BigNumber = balanceInWei2.mul(poolInfo.accRewardPerShare).div(BigNumber.from(10).pow(12));
  //     const userInfo = await controllerV2.userInfo(token.address, user1.address);
  //     expect(userInfo.amount).to.be.equal(balanceInWei2);
  //     expect(userInfo.rewardDebt).to.be.equal(rewardDebt);
  //   });
  //   it("Sould be receive data from v2 (call handle action twice)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei1: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     const balanceInWei2: BigNumber = BigNumber.from(10).pow(18).mul(2000);
  //     const balanceInWei3: BigNumber = BigNumber.from(10).pow(18).mul(3000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei1, balanceInWei1.add(totalSupply));
  //     await controllerV2.setup();
  //     await controllerV2.connect(tokenSigner).handleAction(user1.address, balanceInWei2, balanceInWei1.add(balanceInWei2).add(totalSupply));
  //     await controllerV2.connect(tokenSigner).handleAction(user1.address, balanceInWei3, balanceInWei1.add(balanceInWei3).add(totalSupply));
  //     const poolInfo = await controllerV2.poolInfo(token.address);
  //     const rewardDebt: BigNumber = balanceInWei3.mul(poolInfo.accRewardPerShare).div(BigNumber.from(10).pow(12));
  //     const userInfo = await controllerV2.userInfo(token.address, user1.address);
  //     expect(userInfo.amount).to.be.equal(balanceInWei3);
  //     expect(userInfo.rewardDebt).to.be.equal(rewardDebt);
  //   });
  // });
  // describe("ClaimableReward", () => {
  //   it("Sould be the right amount uDAI (v1 handle action)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei1: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei1, balanceInWei1.add(totalSupply));
  //     await controllerV2.setup();
  //     const blockTimestamp: BigNumber = BigNumber.from(await time.increase(86400 * 7));
  //     const poolInfo1: PoolInfo = await controllerV1.poolInfo(token.address);
  //     const poolInfo2: PoolInfo = await controllerV2.poolInfo(token.address);
  //     const userInfo1: UserInfo = await controllerV1.userInfo(token.address, user1.address);
  //     const userInfo2: UserInfo = await controllerV2.userInfo(token.address, user1.address);
  //     const rewardsPerSecond1: BigNumber = await controllerV1.rewardsPerSecond();
  //     const rewardsPerSecond2: BigNumber = await controllerV2.rewardsPerSecond();
  //     const totalAllocPoint1 = await controllerV1.totalAllocPoint();
  //     const totalAllocPoint2 = await controllerV2.totalAllocPoint();
  //     const claimableReward1: BigNumber[] = await controllerV1.claimableReward(user1.address, [token.address]);
  //     const claimableReward2: BigNumber[] = await controllerV2.claimableReward(user1.address, [token.address]);
  //     const calcClaimableReward1 = calcClaimableReward(poolInfo1, userInfo1, rewardsPerSecond1, totalAllocPoint1, blockTimestamp);
  //     const calcClaimableReward2 = calcClaimableReward(poolInfo2, userInfo2, rewardsPerSecond2, totalAllocPoint2, blockTimestamp);
  //     expect(claimableReward1[0]).to.be.equal(claimableReward2[0]);
  //     expect(claimableReward1[0]).to.be.equal(calcClaimableReward1);
  //     expect(claimableReward1[0]).to.be.equal(calcClaimableReward2);
  //   });
  //   it("Sould be the right amount uDAI (v2 handle action)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await controllerV2.setup();
  //     await time.increase(86400 * 7);
  //     await controllerV2.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     const blockTimestamp: BigNumber = BigNumber.from(await time.increase(86400 * 7));
  //     const claimableReward: BigNumber[] = await controllerV2.claimableReward(user1.address, [token.address]);
  //     const poolInfo: PoolInfo = await controllerV2.poolInfo(token.address);
  //     const userInfo: UserInfo = await controllerV2.userInfo(token.address, user1.address);
  //     const rewardsPerSecond: BigNumber = await controllerV2.rewardsPerSecond();
  //     const totalAllocPoint = await controllerV2.totalAllocPoint();
  //     const calcReward = calcClaimableReward(poolInfo, userInfo, rewardsPerSecond, totalAllocPoint, blockTimestamp);
  //     expect(claimableReward[0]).to.be.equal(calcReward);
  //   });
  // });
  // describe("Claim", () => {
  //   it("Sould be the right amount uDAI (call v1 handleAction)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2, distributor, rewardToken, rewardTokenHolder } = await loadFixture(incentivesController2Fixture);
  //     await rewardToken.connect(rewardTokenHolder).transfer(distributor.address, ethers.utils.parseEther('1000'));
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await time.increase(86400 * 3);
  //     await controllerV2.setup();
  //     await time.increase(86400 * 5);
  //     const userBaseClaimable: BigNumber = await controllerV2.userBaseClaimable(user1.address);
  //     const poolInfo: PoolInfo = await controllerV2.poolInfo(token.address);
  //     const userInfo: UserInfo = await controllerV2.userInfo(token.address, user1.address);
  //     const rewardsPerSecond: BigNumber = await controllerV2.rewardsPerSecond();
  //     const totalAllocPoint = await controllerV2.totalAllocPoint();
  //     const balanceBefore = await rewardToken.balanceOf(user1.address);
  //     const calcReward = calcClaimableReward(poolInfo, userInfo, rewardsPerSecond, totalAllocPoint, BigNumber.from(await time.latest() + 1));
  //     await controllerV2.claim(user1.address, [token.address]);
  //     const balanceAfter = await rewardToken.balanceOf(user1.address);
  //     expect(balanceAfter.sub(balanceBefore)).to.be.equals(userBaseClaimable.add(calcReward));
  //   });
  //   it("Sould be the right amount uDAI (call v1 handleAction twice)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2, distributor, rewardToken, rewardTokenHolder } = await loadFixture(incentivesController2Fixture);
  //     await rewardToken.connect(rewardTokenHolder).transfer(distributor.address, ethers.utils.parseEther('1000'));
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await time.increase(86400 * 3);
  //     await controllerV2.setup();
  //     await time.increase(86400 * 5);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await time.increase(86400 * 7);
  //     const userBaseClaimable: BigNumber = await controllerV2.userBaseClaimable(user1.address);
  //     const poolInfo: PoolInfo = await controllerV2.poolInfo(token.address);
  //     const userInfo: UserInfo = await controllerV2.userInfo(token.address, user1.address);
  //     const rewardsPerSecond: BigNumber = await controllerV2.rewardsPerSecond();
  //     const totalAllocPoint = await controllerV2.totalAllocPoint();
  //     const balanceBefore = await rewardToken.balanceOf(user1.address);
  //     const calcReward = calcClaimableReward(poolInfo, userInfo, rewardsPerSecond, totalAllocPoint, BigNumber.from(await time.latest() + 1));
  //     await controllerV2.claim(user1.address, [token.address]);
  //     const balanceAfter = await rewardToken.balanceOf(user1.address);
  //     expect(balanceAfter.sub(balanceBefore)).to.be.equals(userBaseClaimable.add(calcReward));
  //   });
  //   it("Sould be the right amount uDAI (call v2 handleAction)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2, distributor, rewardToken, rewardTokenHolder } = await loadFixture(incentivesController2Fixture);
  //     await rewardToken.connect(rewardTokenHolder).transfer(distributor.address, ethers.utils.parseEther('1000'));
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await controllerV2.setup();
  //     await time.increase(86400 * 3);
  //     await controllerV2.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await time.increase(86400 * 5);
  //     const userBaseClaimable: BigNumber = await controllerV2.userBaseClaimable(user1.address);
  //     const poolInfo: PoolInfo = await controllerV2.poolInfo(token.address);
  //     const userInfo: UserInfo = await controllerV2.userInfo(token.address, user1.address);
  //     const rewardsPerSecond: BigNumber = await controllerV2.rewardsPerSecond();
  //     const totalAllocPoint = await controllerV2.totalAllocPoint();
  //     const balanceBefore = await rewardToken.balanceOf(user1.address);
  //     const calcReward = calcClaimableReward(poolInfo, userInfo, rewardsPerSecond, totalAllocPoint, BigNumber.from(await time.latest() + 1));
  //     await controllerV2.claim(user1.address, [token.address]);
  //     const balanceAfter = await rewardToken.balanceOf(user1.address);
  //     expect(balanceAfter.sub(balanceBefore)).to.be.equals(userBaseClaimable.add(calcReward));
  //   });
  //   it("Sould be the right amount uDAI (call v2 handleAction twice)", async () => {
  //     const [, user1] = await ethers.getSigners();
  //     const { controllerV1, controllerV2, distributor, rewardToken, rewardTokenHolder } = await loadFixture(incentivesController2Fixture);
  //     await rewardToken.connect(rewardTokenHolder).transfer(distributor.address, ethers.utils.parseEther('1000'));
  //     const tokenAddress: string = await controllerV1.registeredTokens(0);
  //     const token = await ethers.getContractAt("ERC20", tokenAddress);
  //     const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
  //     await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
  //     const totalSupply: BigNumber = await token.totalSupply();
  //     const balanceInWei: BigNumber = BigNumber.from(10).pow(18).mul(1000);
  //     await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await controllerV2.setup();
  //     await time.increase(86400 * 3);
  //     await controllerV2.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await time.increase(86400 * 5);
  //     await controllerV2.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
  //     await time.increase(86400 * 7);
  //     const userBaseClaimable: BigNumber = await controllerV2.userBaseClaimable(user1.address);
  //     const poolInfo: PoolInfo = await controllerV2.poolInfo(token.address);
  //     const userInfo: UserInfo = await controllerV2.userInfo(token.address, user1.address);
  //     const rewardsPerSecond: BigNumber = await controllerV2.rewardsPerSecond();
  //     const totalAllocPoint = await controllerV2.totalAllocPoint();
  //     const balanceBefore = await rewardToken.balanceOf(user1.address);
  //     const calcReward = calcClaimableReward(poolInfo, userInfo, rewardsPerSecond, totalAllocPoint, BigNumber.from(await time.latest() + 1));
  //     await controllerV2.claim(user1.address, [token.address]);
  //     const balanceAfter = await rewardToken.balanceOf(user1.address);
  //     expect(balanceAfter.sub(balanceBefore)).to.be.equals(userBaseClaimable.add(calcReward));
  //   });
  // });
  describe("Founded bugs after audit", () => {
    it("Should be executed correctly: deposit v1 -> migration -> wait -> claim -> claim (second claim has no effects)", async () => {
      const [, user1] = await ethers.getSigners();
      const { controllerV1, controllerV2, distributor, rewardToken, rewardTokenHolder } = await loadFixture(incentivesController2Fixture);
      await rewardToken.connect(rewardTokenHolder).transfer(distributor.address, ethers.utils.parseEther('1000'));
      const tokenAddress: string = await controllerV1.registeredTokens(0);
      const token = await ethers.getContractAt("ERC20", tokenAddress);
      const tokenSigner: SignerWithAddress = await ethers.getImpersonatedSigner(tokenAddress);
      await ethers.provider.send('hardhat_setBalance', [tokenSigner.address, ethers.utils.parseEther('1000').toHexString()]);
      const totalSupply: BigNumber = await token.totalSupply();
      const balanceInWei: BigNumber = BigNumber.from(10).pow(18).mul(1000);
      await controllerV1.connect(tokenSigner).handleAction(user1.address, balanceInWei, balanceInWei.add(totalSupply));
      await time.increase(86400 * 5);
      await controllerV2.setup();
      await time.increase(86400 * 5);
      const claimableReward1: BigNumber[] = await controllerV2.claimableReward(user1.address, [token.address]);
      await controllerV2.claim(user1.address, [token.address]);
      const balance1 = await rewardToken.balanceOf(user1.address);
      console.log('\n');
      // await time.increase(86400 * 10);
      const claimableReward2: BigNumber[] = await controllerV1.claimableReward(user1.address, [token.address]);
      await controllerV2.claim(user1.address, [token.address]);
      const claimableReward3: BigNumber[] = await controllerV2.claimableReward(user1.address, [token.address]);
      await time.increase(1);
      const claimableReward4: BigNumber[] = await controllerV2.claimableReward(user1.address, [token.address]);
      const balance2 = await rewardToken.balanceOf(user1.address);
      console.log('claimableRewards 1,2', claimableReward1[0].toString(), claimableReward2[0].toString());
      console.log('claimableRewards 3,4', claimableReward3[0].toString(), claimableReward4[0].toString());
      console.log('Balances', balance1.toString(), balance2.sub(balance1).toString());

      expect(claimableReward3[0]).to.be.equals(0);
      expect(balance2.sub(balance1)).to.be.equals(claimableReward4[0]);
    })
  });
});
