import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "ethers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers } from "hardhat";
import { expect } from "chai";
import { stakingV2Fixture } from "./fixtures/staking-v2.fixture";

describe("MultiFeeDistributionV2", () => {
  // describe("Deployment", () => {
  //   it("Should be the right set distributor", async () => {
  //     const { distributorV1, distributorV2 } = await loadFixture(stakingV2Fixture);
  //     const distributorAddress: string = await distributorV2.distributor();
  //     expect(distributorAddress).to.be.equals(distributorV1.address);
  //   });
  // });
  // describe("Lock", () => {
  //   it("Should be the right locked token amount", async () => {
  //     const [user] = await ethers.getSigners();
  //     const { distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(stakingV2Fixture);
  //     await stakingToken.connect(stakingTokenHolder).transfer(user.address, ethers.utils.parseEther("500"));
  //     const balanceBefore = await stakingToken.balanceOf(user.address);
  //     const firstAmountInWei = ethers.utils.parseEther("100");
  //     await stakingToken.connect(user).approve(distributorV2.address, firstAmountInWei);
  //     await distributorV2.connect(user).lock(firstAmountInWei, user.address);
  //     const balanceAfter = await stakingToken.balanceOf(user.address);
  //     expect(balanceBefore.sub(balanceAfter)).to.be.equals(ethers.utils.parseEther("100"));
  //   });
  // });
  // describe("LockedBalances", () => {
  //   it("Should set the right balances", async () => {
  //     const [user] = await ethers.getSigners();
  //     const { distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(stakingV2Fixture);
  //     await stakingToken.connect(stakingTokenHolder).transfer(user.address, ethers.utils.parseEther("500"));
  //     const firstAmountInWei = ethers.utils.parseEther("100");
  //     await stakingToken.connect(user).approve(distributorV2.address, firstAmountInWei);
  //     await distributorV2.connect(user).lock(firstAmountInWei, user.address);
  //     await time.increase(86400 * 26);
  //     const secondAmountInWei = ethers.utils.parseEther("200");
  //     await stakingToken.connect(user).approve(distributorV2.address, secondAmountInWei);
  //     await distributorV2.connect(user).lock(secondAmountInWei, user.address);
  //     await time.increase(86400 * 26);
  //     const balances = await distributorV2.lockedBalances(user.address);
  //     expect(balances.total).to.be.equals(ethers.utils.parseEther("300"));
  //     expect(balances.unlockable).to.be.equals(ethers.utils.parseEther("100"));
  //     expect(balances.locked).to.be.equals(ethers.utils.parseEther("200"));
  //     expect(balances.lockData.length).to.be.equals(1);
  //     expect(balances.lockData[0]?.amount).to.be.equals(ethers.utils.parseEther("200"));
  //   });
  // });
  // describe("WithdrawExpiredLocks", () => {
  //   it("Should be the right transfered token amount", async () => {
  //     const [user] = await ethers.getSigners();
  //     const { distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(stakingV2Fixture);
  //     await stakingToken.connect(stakingTokenHolder).transfer(user.address, ethers.utils.parseEther("500"));
  //     const firstAmountInWei = ethers.utils.parseEther("100");
  //     await stakingToken.connect(user).approve(distributorV2.address, firstAmountInWei);
  //     await distributorV2.connect(user).lock(firstAmountInWei, user.address);
  //     await time.increase(86400 * 26);
  //     const secondAmountInWei = ethers.utils.parseEther("200");
  //     await stakingToken.connect(user).approve(distributorV2.address, secondAmountInWei);
  //     await distributorV2.connect(user).lock(secondAmountInWei, user.address);
  //     await time.increase(86400 * 26);
  //     const balanceBefore = await stakingToken.balanceOf(user.address);
  //     await distributorV2.connect(user).withdrawExpiredLocks();
  //     const balanceAfter = await stakingToken.balanceOf(user.address);
  //     expect(balanceAfter.sub(balanceBefore)).to.be.equals(ethers.utils.parseEther("100"));
  //   });
  // });
  // describe("ClaimableRewards", () => {
  //   it("Should be the right token amount", async () => {
  //     const [deployer, user] = await ethers.getSigners();
  //     const {
  //       distributorV1, distributorV2, rewardToken, rewardTokenHolder, rewardTokenVaultAddress, uToken,
  //       stakingToken, stakingTokenHolder
  //      } = await loadFixture(stakingV2Fixture);
  //     await rewardToken.connect(rewardTokenHolder).transfer(distributorV2.address, ethers.utils.parseEther("100"));

  //     // const firstAmountInWei = ethers.utils.parseEther("100");
  //     // await stakingToken.connect(user).approve(distributorV2.address, firstAmountInWei);
  //     // await distributorV2.connect(user).lock(firstAmountInWei, user.address);
  //     // await time.increase(86400 * 26);
  //     // const secondAmountInWei = ethers.utils.parseEther("200");
  //     // await stakingToken.connect(user).approve(distributorV2.address, secondAmountInWei);
  //     // await distributorV2.connect(user).lock(secondAmountInWei, user.address);
  //     // await time.increase(86400 * 26);
  //     // const balanceBefore = await stakingToken.balanceOf(user.address);
  //     // await distributorV2.connect(user).withdrawExpiredLocks();
  //     // const balanceAfter = await stakingToken.balanceOf(user.address);
  //     // expect(balanceAfter.sub(balanceBefore)).to.be.equals(ethers.utils.parseEther("100"));

  //     await distributorV2.connect(deployer).addReward(uToken.address);
  //     const lastTimeRewardApplicable: BigNumber = await distributorV2.lastTimeRewardApplicable(uToken.address);

  //     const incentivesControllerAddress = '0x21953192664867e19F85E96E1D1Dd79dc31cCcdB';
  //     await ethers.provider.send('hardhat_setBalance', [incentivesControllerAddress, ethers.utils.parseEther('1000').toHexString()]);
  //     const incentivesControllerSigner = await ethers.getImpersonatedSigner(incentivesControllerAddress);

  //     await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
  //     const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);

  //     await stakingToken.connect(stakingTokenHolder).transfer(user.address, ethers.utils.parseEther("500"));
  //     const lockAmountInWei = ethers.utils.parseEther("100");
  //     await stakingToken.connect(user).approve(distributorV1.address, lockAmountInWei);
  //     await distributorV1.connect(user).lock(lockAmountInWei, user.address);

  //     await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, ethers.utils.parseEther('1000'));
  //     await distributorV2.setMinters([incentivesControllerAddress]);
  //     // const rewardData1 = await distributorV2.connect(user).rewardData(rewardToken.address);
  //     await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, ethers.utils.parseEther("100"));
  //     // const rewardData2 = await distributorV2.connect(user).rewardData(rewardToken.address);
  //     // await time.increase(86400 * 100);
  //     // const rewardData = await distributorV2.connect(user).rewardData(uToken.address);
  //     await distributorV2.connect(user).getReward([rewardToken.address, uToken.address]);
  //     await time.increase(86400 * 7);
  //     // await distributorV2.connect(user).getReward([rewardToken.address, uToken.address]);
  //     // const rewards = await distributorV2.connect(user).rewards(user.address, uToken.address);
  //     const claimableRewards = await distributorV2.connect(user).claimableRewards(user.address);
  //     const balance = await rewardToken.balanceOf(user.address);
  //     // const earned = await distributorV2.connect(user).earned(user.address, uToken.address);/

  //     // const rewardData2 = await distributorV2.connect(user).rewardData(uToken.address);
  //     // 1614326309036211428
  //     // 1614326309036211427
  //     // console.log('RewardData', rewardData1, rewardData2);
  //     console.log("ClaimableRewards", claimableRewards);
  //     console.log("Balance", balance, '1614326309036211427');
  //   });
  // });

  describe("All LP tokens locked to v1", () => {

    const getCalcAmount = (treasuryAmount: BigNumber, locked: BigNumber, totalLocked: BigNumber) => {
      const ration = locked.mul(BigNumber.from('1000000000000000000000000000000000000')).div(totalLocked);
      return treasuryAmount.mul(ration).div(BigNumber.from('1000000000000000000000000000000000000'));
    }

    it("Should be earned the right utoken amount", async () => {
      const [, user, user2] = await ethers.getSigners();
      const { distributorV1, distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(stakingV2Fixture);
      const lockAmountInWei1 = ethers.utils.parseEther("100");
      const lockAmountInWei2 = ethers.utils.parseEther("100");
      await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
      await stakingToken.connect(user).approve(distributorV1.address, lockAmountInWei1);
      await distributorV1.connect(user).lock(lockAmountInWei1, user.address);
      await stakingToken.connect(user2).approve(distributorV1.address, lockAmountInWei2);
      await distributorV1.connect(user2).lock(lockAmountInWei2, user2.address);
      const totalLockedSupply = await distributorV2.totalLockedSupply();
      await distributorV2.addReward(uToken.address);
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await uToken.transfer(distributorV2.address, treasuryAmountInWei);
      await distributorV2.connect(user).getReward([uToken.address]);
      await time.increase(86400 * 7);
      await distributorV2.connect(user).getReward([uToken.address]);
      await distributorV2.connect(user2).getReward([uToken.address]);
      const balance1 = await uToken.balanceOf(user.address);
      const balance2 = await uToken.balanceOf(user2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1, totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2, totalLockedSupply);
      expect(balance1).to.be.equals(calcAmount1);
      expect(balance2).to.be.equals(calcAmount2);
    });

    it("Should be earned the right reward amount", async () => {
      const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
      const { distributorV1, distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenHolder, rewardTokenVaultAddress } = await loadFixture(stakingV2Fixture);
      const lockAmountInWei1 = ethers.utils.parseEther("100");
      const lockAmountInWei2 = ethers.utils.parseEther("200");
      await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
      await stakingToken.connect(user).approve(distributorV1.address, lockAmountInWei1);
      await distributorV1.connect(user).lock(lockAmountInWei1, user.address);
      await stakingToken.connect(user2).approve(distributorV1.address, lockAmountInWei2);
      await distributorV1.connect(user2).lock(lockAmountInWei2, user2.address);
      const totalLockedSupply = await distributorV2.totalLockedSupply();
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, treasuryAmountInWei);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, treasuryAmountInWei);
      await time.increase(86400 * 7);
      await distributorV2.connect(user).getReward([rewardToken.address]);
      await distributorV2.connect(user2).getReward([rewardToken.address]);
      const balance1 = await rewardToken.balanceOf(user.address);
      const balance2 = await rewardToken.balanceOf(user2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1, totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2, totalLockedSupply);
      expect(balance1).to.be.equals(calcAmount1);
      expect(balance2).to.be.equals(calcAmount2);
    });
  });
});
