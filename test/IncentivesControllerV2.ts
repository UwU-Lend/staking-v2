import { INCENTIVES_CONTROLLER, MAX_MINTABLE, POOL_CONFIGURATOR, REWARDS_PER_SECOND, START_TIME_OFFSET, incentivesController2Fixture } from "./fixtures/incentives-controller-v2.fixture";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("IncentivesControllerV2", () => {
  // describe("Deployment", () => {
  //   it("Should be the right set max mintable tokens", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const maxMintable: BigNumber = await controllerV2.maxMintableTokens();
  //     expect(maxMintable).to.equal(BigNumber.from(MAX_MINTABLE));
  //   });
  //   it("Sould be the right set pool configurator", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const poolConfigurator: string = await controllerV2.poolConfigurator();
  //     expect(poolConfigurator).to.equal(POOL_CONFIGURATOR);
  //   });
  //   it("Sould be the right set reward minter", async () => {
  //     const { controllerV2, distributor } = await loadFixture(incentivesController2Fixture);
  //     const rewardMinter: string = await controllerV2.rewardMinter();
  //     expect(rewardMinter).to.equal(distributor.address);
  //   });
  //   it("Sould be the right set emission schedule", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const length = START_TIME_OFFSET.length;
  //     for (let i = length; i > 0 ; i--) {
  //       const emissionSchedule: { startTimeOffset: BigNumber; rewardsPerSecond: BigNumber } = await controllerV2.emissionSchedule(length - i);
  //       expect(emissionSchedule.startTimeOffset).to.equal(BigNumber.from(START_TIME_OFFSET[i - 1]));
  //       expect(emissionSchedule.rewardsPerSecond).to.equal(BigNumber.from(REWARDS_PER_SECOND[i - 1]));
  //     }
  //     expect(controllerV2.emissionSchedule(length)).to.be.reverted;
  //   });
  //   it("Sould be the right set incentives controller", async () => {
  //     const { controllerV2 } = await loadFixture(incentivesController2Fixture);
  //     const incentivesController: string = await controllerV2.incentivesController();
  //     expect(incentivesController).to.equal(INCENTIVES_CONTROLLER);
  //   });
  // });
  describe("Setup", () => {
    it("Should be the right set initial properties", async () => {
      const { controllerV1, controllerV2 } = await loadFixture(incentivesController2Fixture);
      await controllerV2.setup();
      const startTime1: BigNumber = await controllerV1.startTime();
      const startTime2: BigNumber = await controllerV2.startTime();
      const poolLength1: BigNumber = await controllerV1.poolLength();
      const poolLength2: BigNumber = await controllerV2.poolLength();
      expect(startTime1).to.equal(startTime2);
      expect(poolLength1).to.equal(poolLength2);
      let totalAllocPoint1: BigNumber = BigNumber.from(0);
      for (let i = 0; i < poolLength1.toNumber(); i++) {
        const registeredToken1: string = await controllerV1.registeredTokens(i);
        const registeredToken2: string = await controllerV2.registeredTokens(i);
        expect(registeredToken1).to.equal(registeredToken2);
        const poolInfo1 = await controllerV1.poolInfo(registeredToken1);
        const poolInfo2 = await controllerV2.poolInfo(registeredToken2);

        const emissionSchedule = [
          await controllerV1.emissionSchedule(12),
          await controllerV1.emissionSchedule(11),
          await controllerV1.emissionSchedule(10),
        ];
        // const rewardsPerSecond2: BigNumber = await controllerV2.rewardsPerSecond(0);
        console.log('EmissionSchedule', emissionSchedule);

        expect(poolInfo1.totalSupply).to.equal(poolInfo2.totalSupply);
        expect(poolInfo1.allocPoint).to.equal(poolInfo2.allocPoint);
        expect(poolInfo1.lastRewardTime).to.equal(poolInfo2.lastRewardTime);
        expect(poolInfo1.accRewardPerShare).to.equal(poolInfo2.accRewardPerShare);
        expect(poolInfo1.onwardIncentives).to.equal(poolInfo2.onwardIncentives);
        // expect(rewardsPerSecond1).to.equal(rewardsPerSecond2);
        totalAllocPoint1 = totalAllocPoint1.add(poolInfo1.allocPoint);
      }
      expect(await controllerV2.totalAllocPoint()).to.equal(totalAllocPoint1);
    });
  });
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
  //     expect(userInfo1.amount).to.equal(userInfo2.amount);
  //     expect(userInfo1.rewardDebt).to.equal(userInfo2.rewardDebt);
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
  //     expect(userInfo.amount).to.equal(balanceInWei2);
  //     expect(userInfo.rewardDebt).to.equal(rewardDebt);
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
  //     expect(userInfo.amount).to.equal(balanceInWei3);
  //     expect(userInfo.rewardDebt).to.equal(rewardDebt);
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
  //     await time.increase(86400 * 7);
  //     const poolInfo = await controllerV2.poolInfo(token.address);
  //     console.log('PoolInfo', poolInfo);
  //     const userInfo = await controllerV2.userInfo(token.address, user1.address);
  //     console.log('UserInfo', userInfo);
  //     const claimableReward1 = await controllerV1.claimableReward(user1.address, [token.address]);
  //     const claimableReward2 = await controllerV2.claimableReward(user1.address, [token.address]);
  //     console.log("claimableReward1", claimableReward1.toString(), claimableReward2.toString());
  //   });
  // });
});
