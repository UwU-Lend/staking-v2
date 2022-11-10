import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "ethers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers } from "hardhat";
import { expect } from "chai";
import { stakingV2Fixture } from "./fixtures/staking-v2.fixture";

const getCalcAmount = (treasuryAmount: BigNumber, locked: BigNumber, totalLocked: BigNumber) => {
  const ration = locked.mul(BigNumber.from('1000000000000000000000000000000000000')).div(totalLocked);
  return treasuryAmount.mul(ration).div(BigNumber.from('1000000000000000000000000000000000000'));
}

describe("MultiFeeDistributionV2", () => {
  // describe("Deployment", () => {
  //   it("Should be the right set distributor", async () => {
  //     const { distributorV1, distributorV2 } = await loadFixture(stakingV2Fixture);
  //     const distributorAddress: string = await distributorV2.distributor();
  //     expect(distributorAddress).to.be.equals(distributorV1.address);
  //   });
  // });
  describe("Lock", () => {
    describe("All LP tokens locked to v1", () => {
      it("Should be earned the right utoken amount", async () => {
        const [, user, user2] = await ethers.getSigners();
        const { distributorV1, distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(stakingV2Fixture);
        const lockAmountInWei1 = ethers.utils.parseEther("100");
        const lockAmountInWei2 = ethers.utils.parseEther("200");
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
    describe("All LP tokens locked to v2", () => {
      it("Should be earned the right utoken amount", async () => {
        const [, user, user2] = await ethers.getSigners();
        const { distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(stakingV2Fixture);
        const lockAmountInWei1 = ethers.utils.parseEther("100");
        const lockAmountInWei2 = ethers.utils.parseEther("200");
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1);
        await distributorV2.connect(user).lock(lockAmountInWei1, user.address);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(user2).lock(lockAmountInWei2, user2.address);
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
        const { distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenHolder, rewardTokenVaultAddress } = await loadFixture(stakingV2Fixture);
        const lockAmountInWei1 = ethers.utils.parseEther("100");
        const lockAmountInWei2 = ethers.utils.parseEther("200");
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1);
        await distributorV2.connect(user).lock(lockAmountInWei1, user.address);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(user2).lock(lockAmountInWei2, user2.address);
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
    describe("locked LP tokens divided between v1 and v2", () => {
      it("Should be earned the right utoken amount", async () => {
        const [, user, user2] = await ethers.getSigners();
        const { distributorV1, distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(stakingV2Fixture);
        const lockAmountInWei1_1 = ethers.utils.parseEther("100");
        const lockAmountInWei1_2 = ethers.utils.parseEther("200");
        const lockAmountInWei2_1 = ethers.utils.parseEther("300");
        const lockAmountInWei2_2 = ethers.utils.parseEther("400");
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1_1.add(lockAmountInWei1_2));
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2_1.add(lockAmountInWei2_2));
        await stakingToken.connect(user).approve(distributorV1.address, lockAmountInWei1_1);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1_2);
        await distributorV1.connect(user).lock(lockAmountInWei1_1, user.address);
        await distributorV2.connect(user).lock(lockAmountInWei1_2, user.address);
        await stakingToken.connect(user2).approve(distributorV1.address, lockAmountInWei2_1);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2_2);
        await distributorV1.connect(user2).lock(lockAmountInWei2_1, user2.address);
        await distributorV2.connect(user2).lock(lockAmountInWei2_2, user2.address);
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
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1_1.add(lockAmountInWei1_2), totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2_1.add(lockAmountInWei2_2), totalLockedSupply);
        expect(balance1).to.be.equals(calcAmount1);
        expect(balance2).to.be.equals(calcAmount2);
      });
      it("Should be earned the right reward amount", async () => {
        const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
        const { distributorV1, distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenHolder, rewardTokenVaultAddress } = await loadFixture(stakingV2Fixture);
        const lockAmountInWei1_1 = ethers.utils.parseEther("100");
        const lockAmountInWei1_2 = ethers.utils.parseEther("200");
        const lockAmountInWei2_1 = ethers.utils.parseEther("300");
        const lockAmountInWei2_2 = ethers.utils.parseEther("400");
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1_1.add(lockAmountInWei1_2));
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2_1.add(lockAmountInWei2_2));
        await stakingToken.connect(user).approve(distributorV1.address, lockAmountInWei1_1);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1_2);
        await distributorV1.connect(user).lock(lockAmountInWei1_1, user.address);
        await distributorV2.connect(user).lock(lockAmountInWei1_2, user.address);
        await stakingToken.connect(user2).approve(distributorV1.address, lockAmountInWei2_1);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2_2);
        await distributorV1.connect(user2).lock(lockAmountInWei2_1, user2.address);
        await distributorV2.connect(user2).lock(lockAmountInWei2_2, user2.address);
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
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1_1.add(lockAmountInWei1_2), totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2_1.add(lockAmountInWei2_2), totalLockedSupply);
        expect(balance1).to.be.equals(calcAmount1);
        expect(balance2).to.be.equals(calcAmount2);
      });
    });
  });
});
