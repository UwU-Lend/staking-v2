import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "ethers";
import { IMigration } from "../typechain-types/contracts/Migration.sol/Migration";
import { MultiFeeDistributionV2 } from "../typechain-types";
import { MultiFeeDistributionV2Fixture } from "./fixtures/multi-fee-distribution-v2.fixture";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { expect } from "chai";

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';


const earned = (balance: BigNumber, currentRewardPerToken: BigNumber, rewardPerTokenPaid: BigNumber): BigNumber => {
  return balance.mul(currentRewardPerToken.sub(rewardPerTokenPaid));// .add(rewards);
}

const rewardPerToken = (lastTime: BigNumber, lastUpdateTime: BigNumber, rewardRate: BigNumber, supply: BigNumber): BigNumber => {
  return lastTime.sub(lastUpdateTime).mul(rewardRate).div(supply);
}

const getCalcAmount = (treasuryAmount: BigNumber, locked: BigNumber, totalLocked: BigNumber): BigNumber => {
  const ration = locked.mul(BigNumber.from('1000000000000000000000000000000000000')).div(totalLocked);
  return treasuryAmount.mul(ration).div(BigNumber.from('1000000000000000000000000000000000000'));
}
type AdjustRewardResult = {
  adjustedAmount: BigNumber,
  feeAmount: BigNumber,
}
const adjustReward = (rewardAmount: BigNumber, teamRewardFee: BigNumber): AdjustRewardResult => {
  const feeAmount = rewardAmount.mul(teamRewardFee).div(10000);
  const adjustedAmount = rewardAmount.sub(feeAmount);
  return { adjustedAmount, feeAmount };
}

describe("MultiFeeDistributionV2", () => {
  describe("Deployment", () => {
    it("Sould be the right set staking token", async () => {
      const { distributorV2, stakingToken } = await loadFixture(MultiFeeDistributionV2Fixture);
      const tokenAddress: string = await distributorV2.stakingToken();
      expect(stakingToken.address).to.be.equals(tokenAddress);
    });
    it("Sould be the right set reward token", async () => {
      const { distributorV2, rewardToken } = await loadFixture(MultiFeeDistributionV2Fixture);
      const tokenAddress: string = await distributorV2.rewardToken();
      expect(rewardToken.address).to.be.equals(tokenAddress);
    });
    it("Sould be the right set reward token vault", async () => {
      const { distributorV2, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
      const vaultAddress: string = await distributorV2.rewardTokenVault();
      expect(rewardTokenVaultAddress).to.be.equals(vaultAddress);
    });
    it("Sould be the right set team fee", async () => {
      const { distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      const teamRewardFee: BigNumber = await distributorV2.teamRewardFee();
      expect(teamRewardFee).to.be.equals(2000);
    });
  });
  describe("LockedBalances", () => {
    it("Should be the right set locked tokens amount", async () => {
      const [, user, user2] = await ethers.getSigners();
      const { distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1_1 = ethers.utils.parseEther("100");
      const lockAmountInWei1_2 = ethers.utils.parseEther("200");
      const lockAmountInWei2_1 = ethers.utils.parseEther("300");
      const lockAmountInWei2_2 = ethers.utils.parseEther("400");
      await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1_1.add(lockAmountInWei1_2));
      await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2_1.add(lockAmountInWei2_2));
      await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1_1);
      await distributorV2.connect(user).lock(lockAmountInWei1_1, user.address);
      await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2_1);
      await distributorV2.connect(user2).lock(lockAmountInWei2_1, user2.address);
      await time.increase(86400 * 28);
      await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1_2);
      await distributorV2.connect(user).lock(lockAmountInWei1_2, user.address);
      await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2_2);
      await distributorV2.connect(user2).lock(lockAmountInWei2_2, user2.address);
      await time.increase(86400 * 28);
      const lockedBalances1 = await distributorV2.lockedBalances(user.address);
      const lockedBalances2 = await distributorV2.lockedBalances(user2.address);
      expect(lockedBalances1.total).to.be.equals(lockAmountInWei1_1.add(lockAmountInWei1_2));
      expect(lockedBalances1.unlockable).to.be.equals(lockAmountInWei1_1);
      expect(lockedBalances1.locked).to.be.equals(lockAmountInWei1_2);
      expect(lockedBalances1.lockData.length).to.be.equals(1);
      expect(lockedBalances1.lockData[0].amount).to.be.equals(lockAmountInWei1_2);
      expect(lockedBalances2.total).to.be.equals(lockAmountInWei2_1.add(lockAmountInWei2_2));
      expect(lockedBalances2.unlockable).to.be.equals(lockAmountInWei2_1);
      expect(lockedBalances2.locked).to.be.equals(lockAmountInWei2_2);
      expect(lockedBalances2.lockData.length).to.be.equals(1);
      expect(lockedBalances2.lockData[0].amount).to.be.equals(lockAmountInWei2_2);
    });
  });
  describe("TotalAccountLocked", () => {
    it("Should be the right amount tokens (listed only migration)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      const balance1: BigNumber = await distributorV2.totalAccountLocked(account1.address);
      const balance2: BigNumber = await distributorV2.totalAccountLocked(account2.address);
      expect(balance1).to.be.equals(600);
      expect(balance2).to.be.equals(1500);
    });
    it("Should be the right amount tokens (listed between migration and distributionV2)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await ethers.provider.send('hardhat_setBalance', [stakingTokenHolder.address, ethers.utils.parseEther('1000').toHexString()]);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const balance1: BigNumber = await distributorV2.totalAccountLocked(account1.address);
      const balance2: BigNumber = await distributorV2.totalAccountLocked(account2.address);
      expect(balance1).to.be.equals(700);
      expect(balance2).to.be.equals(1700);
    });
    it("Should be the right amount tokens (listed only distributionV2 with migration enabled)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      await distributorV2.setMigration(migration.address);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const balance1: BigNumber = await distributorV2.totalAccountLocked(account1.address);
      const balance2: BigNumber = await distributorV2.totalAccountLocked(account2.address);
      expect(balance1).to.be.equals(100);
      expect(balance2).to.be.equals(200);
    });
    it("Should be the right amount tokens (listed only distributionV2 with migration disabled)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const balance1: BigNumber = await distributorV2.totalAccountLocked(account1.address);
      const balance2: BigNumber = await distributorV2.totalAccountLocked(account2.address);
      expect(balance1).to.be.equals(100);
      expect(balance2).to.be.equals(200);
    });
    it("Should be the right amount tokens (listed only distributionV2 with migration disabled and migration has balances)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await ethers.provider.send('hardhat_setBalance', [stakingTokenHolder.address, ethers.utils.parseEther('1000').toHexString()]);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const balance1: BigNumber = await distributorV2.totalAccountLocked(account1.address);
      const balance2: BigNumber = await distributorV2.totalAccountLocked(account2.address);
      expect(balance1).to.be.equals(100);
      expect(balance2).to.be.equals(200);
    });
  });
  describe("TotalLockedSupply", () => {
    it("Should be the right amount tokens (listed only migration)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      expect(totalLockedSupply).to.be.equals(2100);
    });
    it("Should be the right amount tokens (listed between migration and distributionV2)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await ethers.provider.send('hardhat_setBalance', [stakingTokenHolder.address, ethers.utils.parseEther('1000').toHexString()]);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      expect(totalLockedSupply).to.be.equals(2400);
    });
    it("Should be the right amount tokens (listed only distributionV2 with migration enabled)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      await distributorV2.setMigration(migration.address);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      expect(totalLockedSupply).to.be.equals(300);
    });
    it("Should be the right amount tokens (listed only distributionV2 with migration disabled)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      expect(totalLockedSupply).to.be.equals(300);
    });
    it("Should be the right amount tokens (listed only distributionV2 with migration disabled and migration has balances)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await ethers.provider.send('hardhat_setBalance', [stakingTokenHolder.address, ethers.utils.parseEther('1000').toHexString()]);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      expect(totalLockedSupply).to.be.equals(300);
    });
  });
  describe("ClaimableRewards", () => {
    it("Should be the right amount utokens (listed only migration)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, uToken, rewardToken } = await loadFixture(MultiFeeDistributionV2Fixture);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 30,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 30,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      await distributorV2.addReward(uToken.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await uToken.transfer(distributorV2.address, treasuryAmountInWei);
      await distributorV2.getReward([uToken.address]);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(600), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(1500), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(2);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(0);
      expect(claimableRewards1[1].token).to.be.equals(uToken.address);
      expect(claimableRewards1[1].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(2);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(0);
      expect(claimableRewards2[1].token).to.be.equals(uToken.address);
      expect(claimableRewards2[1].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount utokens (listed between migration and v2)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, uToken, rewardToken, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 30,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 30,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      await distributorV2.addReward(uToken.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await uToken.transfer(distributorV2.address, treasuryAmountInWei);
      await distributorV2.getReward([uToken.address]);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(700), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(1700), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(2);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(0);
      expect(claimableRewards1[1].token).to.be.equals(uToken.address);
      expect(claimableRewards1[1].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(2);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(0);
      expect(claimableRewards2[1].token).to.be.equals(uToken.address);
      expect(claimableRewards2[1].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount utokens (listed only v2 with migration enabled)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, uToken, rewardToken, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      await distributorV2.setMigration(migration.address);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      await distributorV2.addReward(uToken.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await uToken.transfer(distributorV2.address, treasuryAmountInWei);
      await distributorV2.getReward([uToken.address]);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(100), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(200), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(2);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(0);
      expect(claimableRewards1[1].token).to.be.equals(uToken.address);
      expect(claimableRewards1[1].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(2);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(0);
      expect(claimableRewards2[1].token).to.be.equals(uToken.address);
      expect(claimableRewards2[1].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount utokens (listed only v2 with migration disabled)", async () => {
      const [account1, account2] = await ethers.getSigners();
      const { distributorV2, uToken, rewardToken, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      await distributorV2.addReward(uToken.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await uToken.transfer(distributorV2.address, treasuryAmountInWei);
      await distributorV2.getReward([uToken.address]);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(100), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(200), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(2);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(0);
      expect(claimableRewards1[1].token).to.be.equals(uToken.address);
      expect(claimableRewards1[1].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(2);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(0);
      expect(claimableRewards2[1].token).to.be.equals(uToken.address);
      expect(claimableRewards2[1].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount reward tokens (listed only migration)", async () => {
      const [account1, account2, incentivesControllerSigner] = await ethers.getSigners();
      const { migration, distributorV2, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 30,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 30,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, treasuryAmountInWei);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, treasuryAmountInWei);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(600), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(1500), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(1);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(1);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount reward tokens (listed between migration and v2)", async () => {
      const [account1, account2, incentivesControllerSigner] = await ethers.getSigners();
      const { migration, distributorV2, rewardToken, rewardTokenVaultAddress, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 30,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 30,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await distributorV2.setMigration(migration.address);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, treasuryAmountInWei);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, treasuryAmountInWei);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(700), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(1700), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(1);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(1);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount reward tokens (listed only v2 with migration enabled)", async () => {
      const [account1, account2, incentivesControllerSigner] = await ethers.getSigners();
      const { migration, distributorV2, rewardToken, rewardTokenVaultAddress, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      await distributorV2.setMigration(migration.address);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, treasuryAmountInWei);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, treasuryAmountInWei);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(100), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(200), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(1);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(1);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount reward tokens (listed only v2 with migration disabled)", async () => {
      const [account1, account2, incentivesControllerSigner] = await ethers.getSigners();
      const { distributorV2, rewardToken, rewardTokenVaultAddress, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, treasuryAmountInWei);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, treasuryAmountInWei);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(100), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(200), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(1);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(1);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(calcAmount2);
    });
    it("Should be the right amount reward tokens (listed only v2 with migration disabled and migration has balances)", async () => {
      const [account1, account2, incentivesControllerSigner] = await ethers.getSigners();
      const { migration, distributorV2, rewardToken, rewardTokenVaultAddress, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 30,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 10,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 20,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 30,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      const lockAmountInWei1 = 100;
      const lockAmountInWei2 = 200;
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
      const treasuryAmountInWei = ethers.utils.parseEther("1000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, treasuryAmountInWei);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, treasuryAmountInWei);
      await time.increase(86400 * 7);
      const claimableRewards1: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account1.address);
      const claimableRewards2: MultiFeeDistributionV2.RewardDataStructOutput[] = await distributorV2.claimableRewards(account2.address);
      const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(100), totalLockedSupply);
      const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(200), totalLockedSupply);
      expect(claimableRewards1.length).to.be.equals(1);
      expect(claimableRewards1[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards1[0].amount).to.be.equals(calcAmount1);
      expect(claimableRewards2.length).to.be.equals(1);
      expect(claimableRewards2[0].token).to.be.equals(rewardToken.address);
      expect(claimableRewards2[0].amount).to.be.equals(calcAmount2);
    });
  });
  describe("SetMigration", () => {
    it("Should be reverted when not owner called method", async () => {
      const [owner, notOwner, migration] = await ethers.getSigners();
      const { distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      await expect(distributorV2.connect(notOwner).setMigration(migration.address)).to.be.reverted;
      await expect(distributorV2.connect(owner).setMigration(migration.address)).to.be.not.reverted;
    });
    it("Should be able change migration address", async () => {
      const [newMigration] = await ethers.getSigners();
      const { distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      const migrationAddress1: string = await distributorV2.migration();
      await distributorV2.setMigration(newMigration.address);
      const migrationAddress2: string = await distributorV2.migration();
      expect(migrationAddress1).to.be.equals(ZERO_ADDRESS);
      expect(migrationAddress2).to.be.equals(newMigration.address);
    });
  });
  describe("RemoveMigration", () => {
    it("Should be reverted when not owner called method", async () => {
      const [owner, notOwner] = await ethers.getSigners();
      const { migration, distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      await distributorV2.setMigration(migration.address);
      await expect(distributorV2.connect(notOwner).removeMigration()).to.be.reverted;
      await expect(distributorV2.connect(owner).removeMigration()).to.be.not.reverted;
    });
    it("Should be able remove migration", async () => {
      const { migration, distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      await distributorV2.setMigration(migration.address);
      const migrationAddress1: string = await distributorV2.migration();
      await distributorV2.removeMigration();
      const migrationAddress2: string = await distributorV2.migration();
      expect(migrationAddress1).to.be.equals(migration.address);
      expect(migrationAddress2).to.be.equals(ZERO_ADDRESS);
    });
    it("Should be reverted when remove early (totalSupply != 0)", async () => {
      const [, account1, account2, updater ] = await ethers.getSigners();
      const { migration, distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.setUpdater(updater.address);
      await distributorV2.setMigration(migration.address);
      await expect(distributorV2.removeMigration()).to.be.reverted;
    });
    it("Should be execute correct", async () => {
      const [, account1, account2, updater ] = await ethers.getSigners();
      const { migration, distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: 100,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 200,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 300,
        validUntil: latest + 86400 * 3,
      }];
      const balances2: IMigration.BalanceStruct[] = [{
        amount: 400,
        validUntil: latest + 86400 * 1,
      }, {
        amount: 500,
        validUntil: latest + 86400 * 2,
      }, {
        amount: 600,
        validUntil: latest + 86400 * 3,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
      await migration.setUpdater(updater.address);
      await distributorV2.setMigration(migration.address);
      await time.increase(86400 * 7);
      await migration.connect(updater).update(account1.address);
      await migration.connect(updater).update(account2.address);
      await expect(distributorV2.removeMigration()).to.be.not.reverted;
      expect(await distributorV2.migration()).to.be.equals(ZERO_ADDRESS);
    });
  });
  describe("PublicExit", () => {
    it("Should be reverted when not owner called method", async () => {
      const [owner, notOwner] = await ethers.getSigners();
      const { distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      await expect(distributorV2.connect(notOwner).publicExit()).to.be.reverted;
      await expect(distributorV2.connect(owner).publicExit()).to.be.not.reverted;
    });
    it("Should be reverted when call method twice", async () => {
      const { distributorV2 } = await loadFixture(MultiFeeDistributionV2Fixture);
      await expect(distributorV2.publicExit()).to.be.not.reverted;
      await expect(distributorV2.publicExit()).to.be.reverted;
    });
    it("Should be able withdrawal locked tokens", async () => {
      const [, account1, account2] = await ethers.getSigners();
      const { migration, distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      const lockAmountInWei1 = ethers.utils.parseEther("100");
      const lockAmountInWei2 = ethers.utils.parseEther("200");
      await distributorV2.setMigration(migration.address);
      await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
      await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
      await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
      await distributorV2.publicExit();
      await distributorV2.connect(account1).withdrawExpiredLocks();
      await distributorV2.connect(account2).withdrawExpiredLocks();
      expect(await stakingToken.balanceOf(account1.address)).to.be.equal(lockAmountInWei1);
      expect(await stakingToken.balanceOf(account2.address)).to.be.equal(lockAmountInWei2);
    });
  });
  describe("Lock -> MintToTreasury -> GetReward", () => {
    describe("All LP tokens listed on migration contract", () => {
      it("Should be earned the right utoken amount", async () => {
        const [, account1, account2] = await ethers.getSigners();
        const { migration, distributorV2, uToken } = await loadFixture(MultiFeeDistributionV2Fixture);
        const latest: number = await time.latest();
        const balances1: IMigration.BalanceStruct[] = [{
          amount: 100,
          validUntil: latest + 86400 * 1,
        }, {
          amount: 200,
          validUntil: latest + 86400 * 2,
        }, {
          amount: 300,
          validUntil: latest + 86400 * 3,
        }];
        const balances2: IMigration.BalanceStruct[] = [{
          amount: 400,
          validUntil: latest + 86400 * 1,
        }, {
          amount: 500,
          validUntil: latest + 86400 * 2,
        }, {
          amount: 600,
          validUntil: latest + 86400 * 3,
        }];
        await migration.setDistributor(distributorV2.address);
        await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
        await distributorV2.setMigration(migration.address);
        await distributorV2.addReward(uToken.address);
        const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
        const treasuryAmountInWei = ethers.utils.parseEther("1000");
        await uToken.transfer(distributorV2.address, treasuryAmountInWei);
        await distributorV2.getReward([uToken.address]);
        await time.increase(86400 * 7);
        await distributorV2.connect(account1).getReward([uToken.address]);
        await distributorV2.connect(account2).getReward([uToken.address]);
        const balance1 = await uToken.balanceOf(account1.address);
        const balance2 = await uToken.balanceOf(account2.address);
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(600), totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(1500), totalLockedSupply);
        expect(balance1).to.be.equals(calcAmount1);
        expect(balance2).to.be.equals(calcAmount2);
      });
      it("Should be earned the right reward amount", async () => {
        const [, account1, account2, incentivesControllerSigner] = await ethers.getSigners();
        const { migration, distributorV2, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
        const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
        await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
        const latest: number = await time.latest();
        const balances1: IMigration.BalanceStruct[] = [{
          amount: 100,
          validUntil: latest + 86400 * 1,
        }, {
          amount: 200,
          validUntil: latest + 86400 * 2,
        }, {
          amount: 300,
          validUntil: latest + 86400 * 3,
        }];
        const balances2: IMigration.BalanceStruct[] = [{
          amount: 400,
          validUntil: latest + 86400 * 1,
        }, {
          amount: 500,
          validUntil: latest + 86400 * 2,
        }, {
          amount: 600,
          validUntil: latest + 86400 * 3,
        }];
        await migration.setDistributor(distributorV2.address);
        await migration.setBalancesBatch([account1.address, account2.address], [balances1, balances2]);
        await distributorV2.setMigration(migration.address);
        const totalLockedSupply: BigNumber = await distributorV2.totalLockedSupply();
        const treasuryAmountInWei = ethers.utils.parseEther("1000");
        await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, treasuryAmountInWei);
        await distributorV2.setMinters([incentivesControllerSigner.address]);
        await distributorV2.connect(incentivesControllerSigner).mint(distributorV2.address, treasuryAmountInWei);
        await time.increase(86400 * 7);
        await distributorV2.connect(account1).getReward([rewardToken.address]);
        await distributorV2.connect(account2).getReward([rewardToken.address]);
        const balance1 = await rewardToken.balanceOf(account1.address);
        const balance2 = await rewardToken.balanceOf(account2.address);
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, BigNumber.from(600), totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, BigNumber.from(1500), totalLockedSupply);
        expect(balance1).to.be.equals(calcAmount1);
        expect(balance2).to.be.equals(calcAmount2);
      });
    });
    describe("All LP tokens locked only to v2", () => {
      it("Should be earned the right utoken amount (migration enabled)", async () => {
        const [, account1, account2] = await ethers.getSigners();
        const { migration, distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
        const lockAmountInWei1 = ethers.utils.parseEther("100");
        const lockAmountInWei2 = ethers.utils.parseEther("200");
        await distributorV2.setMigration(migration.address);
        await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
        await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
        await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
        await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
        const totalLockedSupply = await distributorV2.totalLockedSupply();
        await distributorV2.addReward(uToken.address);
        const treasuryAmountInWei = ethers.utils.parseEther("1000");
        await uToken.transfer(distributorV2.address, treasuryAmountInWei);
        await distributorV2.getReward([uToken.address]);
        await time.increase(86400 * 7);
        await distributorV2.connect(account1).getReward([uToken.address]);
        await distributorV2.connect(account2).getReward([uToken.address]);
        const balance1 = await uToken.balanceOf(account1.address);
        const balance2 = await uToken.balanceOf(account2.address);
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1, totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2, totalLockedSupply);
        expect(balance1).to.be.equals(calcAmount1);
        expect(balance2).to.be.equals(calcAmount2);
      });
      it("Should be earned the right utoken amount (migration disabled)", async () => {
        const [, account1, account2] = await ethers.getSigners();
        const { migration, distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
        const lockAmountInWei1 = ethers.utils.parseEther("100");
        const lockAmountInWei2 = ethers.utils.parseEther("200");
        await stakingToken.connect(stakingTokenHolder).transfer(account1.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(account2.address, lockAmountInWei2);
        await stakingToken.connect(account1).approve(distributorV2.address, lockAmountInWei1);
        await stakingToken.connect(account2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(account1).lock(lockAmountInWei1, account1.address);
        await distributorV2.connect(account2).lock(lockAmountInWei2, account2.address);
        const totalLockedSupply = await distributorV2.totalLockedSupply();
        await distributorV2.addReward(uToken.address);
        const treasuryAmountInWei = ethers.utils.parseEther("1000");
        await uToken.transfer(distributorV2.address, treasuryAmountInWei);
        await distributorV2.getReward([uToken.address]);
        await time.increase(86400 * 7);
        await distributorV2.connect(account1).getReward([uToken.address]);
        await distributorV2.connect(account2).getReward([uToken.address]);
        const balance1 = await uToken.balanceOf(account1.address);
        const balance2 = await uToken.balanceOf(account2.address);
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1, totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2, totalLockedSupply);
        expect(balance1).to.be.equals(calcAmount1);
        expect(balance2).to.be.equals(calcAmount2);
      });
      it("Should be earned the right reward amount (migration enabled)", async () => {
        const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
        const { migration, distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
        const lockAmountInWei1 = ethers.utils.parseEther("100");
        const lockAmountInWei2 = ethers.utils.parseEther("200");
        await distributorV2.setMigration(migration.address);
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(user).lock(lockAmountInWei1, user.address);
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
      it("Should be earned the right reward amount (migration disabled)", async () => {
        const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
        const { migration, distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
        const lockAmountInWei1 = ethers.utils.parseEther("100");
        const lockAmountInWei2 = ethers.utils.parseEther("200");
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(user).lock(lockAmountInWei1, user.address);
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
        const { migration, distributorV2, uToken, stakingToken, stakingTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
        const migrationAmountInWei1 = ethers.utils.parseEther("100");
        const migrationAmountInWei2 = ethers.utils.parseEther("200");
        const lockAmountInWei1 = ethers.utils.parseEther("300");
        const lockAmountInWei2 = ethers.utils.parseEther("400");
        const latest: number = await time.latest();
        const balances1: IMigration.BalanceStruct[] = [{
          amount: migrationAmountInWei1,
          validUntil: latest + 86400 * 10,
        }];
        const balances2: IMigration.BalanceStruct[] = [{
          amount: migrationAmountInWei2,
          validUntil: latest + 86400 * 10,
        }];
        await migration.setDistributor(distributorV2.address);
        await migration.setBalancesBatch([user.address, user2.address], [balances1, balances2]);
        await distributorV2.setMigration(migration.address);
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(user).lock(lockAmountInWei1, user.address);
        await distributorV2.connect(user2).lock(lockAmountInWei2, user2.address);
        const totalLockedSupply = await distributorV2.totalLockedSupply();
        const treasuryAmountInWei = ethers.utils.parseEther("1000");
        await uToken.transfer(distributorV2.address, treasuryAmountInWei);
        await distributorV2.addReward(uToken.address);
        await distributorV2.getReward([uToken.address]);
        await time.increase(86400 * 7);
        await distributorV2.connect(user).getReward([uToken.address]);
        await distributorV2.connect(user2).getReward([uToken.address]);
        const balance1 = await uToken.balanceOf(user.address);
        const balance2 = await uToken.balanceOf(user2.address);
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1.add(migrationAmountInWei1), totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2.add(migrationAmountInWei2), totalLockedSupply);
        const diff1 = calcAmount1 > balance1 ? calcAmount1.sub(balance1) : balance1.sub(calcAmount1);
        const diff2 = calcAmount2 > balance2 ? calcAmount2.sub(balance2) : balance2.sub(calcAmount2);
        expect(diff1).to.be.lte(1);
        expect(diff2).to.be.lte(1);
      });
      it("Should be earned the right reward amount", async () => {
        const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
        const { migration, distributorV2, stakingToken, stakingTokenHolder, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
        const migrationAmountInWei1 = ethers.utils.parseEther("100");
        const migrationAmountInWei2 = ethers.utils.parseEther("200");
        const lockAmountInWei1 = ethers.utils.parseEther("300");
        const lockAmountInWei2 = ethers.utils.parseEther("400");
        const latest: number = await time.latest();
        const balances1: IMigration.BalanceStruct[] = [{
          amount: migrationAmountInWei1,
          validUntil: latest + 86400 * 10,
        }];
        const balances2: IMigration.BalanceStruct[] = [{
          amount: migrationAmountInWei2,
          validUntil: latest + 86400 * 10,
        }];
        await migration.setDistributor(distributorV2.address);
        await migration.setBalancesBatch([user.address, user2.address], [balances1, balances2]);
        await distributorV2.setMigration(migration.address);
        await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
        await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
        await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1);
        await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
        await distributorV2.connect(user).lock(lockAmountInWei1, user.address);
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
        const calcAmount1 = getCalcAmount(treasuryAmountInWei, lockAmountInWei1.add(migrationAmountInWei1), totalLockedSupply);
        const calcAmount2 = getCalcAmount(treasuryAmountInWei, lockAmountInWei2.add(migrationAmountInWei2), totalLockedSupply);
        const diff1 = calcAmount1 > balance1 ? calcAmount1.sub(balance1) : balance1.sub(calcAmount1);
        const diff2 = calcAmount2 > balance2 ? calcAmount2.sub(balance2) : balance2.sub(calcAmount2);
        expect(diff1).to.be.lte(1);
        expect(diff2).to.be.lte(1);
      });
    });
  });
  describe("Start vesting -> withdraw", () => {
    it("Sould be the right reward token withdrawal", async () => {
      const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
      const { distributorV2, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      const mintAmountInWei1 = ethers.utils.parseEther("1000");
      const mintAmountInWei2 = ethers.utils.parseEther("2000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, mintAmountInWei1.add(mintAmountInWei2));
      await distributorV2.connect(incentivesControllerSigner).mint(user.address, mintAmountInWei1);
      await distributorV2.connect(incentivesControllerSigner).mint(user2.address, mintAmountInWei2);
      await time.increase(86400 * 28);
      await distributorV2.connect(user).withdraw();
      await distributorV2.connect(user2).withdraw();
      const balance1 = await rewardToken.balanceOf(user.address);
      const balance2 = await rewardToken.balanceOf(user2.address);
      expect(balance1).to.be.equals(mintAmountInWei1);
      expect(balance2).to.be.equals(mintAmountInWei2);
    });
  });
  describe("Start vesting -> exit early", () => {
    it("Sould be the right reward token withdrawal (50% penalty)", async () => {
      const [, user, user2] = await ethers.getSigners();
      const { distributorV2, rewardToken, rewardTokenVaultAddress, incentivesController } = await loadFixture(MultiFeeDistributionV2Fixture);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      await ethers.provider.send('hardhat_setBalance', [incentivesController.address, ethers.utils.parseEther('1000').toHexString()]);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      const incentivesControllerSigner = await ethers.getImpersonatedSigner(incentivesController.address);
      await distributorV2.setIncentivesController(incentivesController.address);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      const mintAmountInWei1 = ethers.utils.parseEther("1000");
      const mintAmountInWei2 = ethers.utils.parseEther("2000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, mintAmountInWei1.add(mintAmountInWei2));
      await distributorV2.connect(incentivesControllerSigner).mint(user.address, mintAmountInWei1);
      await distributorV2.connect(incentivesControllerSigner).mint(user2.address, mintAmountInWei2);
      await time.increase(86400 * 7);
      await distributorV2.connect(user).exitEarly(user.address);
      await distributorV2.connect(user2).exitEarly(user2.address);
      const balance1 = await rewardToken.balanceOf(user.address);
      const balance2 = await rewardToken.balanceOf(user2.address);
      expect(balance1).to.be.equals(mintAmountInWei1.div(2));
      expect(balance2).to.be.equals(mintAmountInWei2.div(2));
    });
  });
  describe("Start vesting -> exit early -> GetReward (50% penalty)", () => {
    it("Sould be the right token rewarded by exit early", async () => {
      const [, user, user2] = await ethers.getSigners();
      const { distributorV2, rewardToken, rewardTokenVaultAddress, stakingToken, stakingTokenHolder, incentivesController } = await loadFixture(MultiFeeDistributionV2Fixture);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      await ethers.provider.send('hardhat_setBalance', [incentivesController.address, ethers.utils.parseEther('1000').toHexString()]);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      const incentivesControllerSigner = await ethers.getImpersonatedSigner(incentivesController.address);
      await distributorV2.setIncentivesController(incentivesController.address);
      await distributorV2.setMinters([incentivesController.address]);
      const lockAmountInWei1 = ethers.utils.parseEther("100");
      const lockAmountInWei2 = ethers.utils.parseEther("200");
      await stakingToken.connect(stakingTokenHolder).transfer(user.address, lockAmountInWei1);
      await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
      await stakingToken.connect(user).approve(distributorV2.address, lockAmountInWei1);
      await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(user).lock(lockAmountInWei1, user.address);
      await distributorV2.connect(user2).lock(lockAmountInWei2, user2.address);
      const totalLockedSupply = await distributorV2.totalLockedSupply();
      const mintAmountInWei1 = ethers.utils.parseEther("1000");
      const mintAmountInWei2 = ethers.utils.parseEther("2000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, mintAmountInWei1.add(mintAmountInWei2));
      await distributorV2.connect(incentivesControllerSigner).mint(user.address, mintAmountInWei1);
      await distributorV2.connect(incentivesControllerSigner).mint(user2.address, mintAmountInWei2);
      await time.increase(86400 * 7);
      await distributorV2.connect(user).exitEarly(user.address);
      await distributorV2.connect(user2).exitEarly(user2.address);
      const rewardAmountInWei = mintAmountInWei1.add(mintAmountInWei2).div(2);
      await time.increase(86400 * 7);
      await distributorV2.connect(user).getReward([rewardToken.address]);
      await distributorV2.connect(user2).getReward([rewardToken.address]);
      const balance1 = await rewardToken.balanceOf(user.address);
      const balance2 = await rewardToken.balanceOf(user2.address);
      const calcAmount1 = getCalcAmount(rewardAmountInWei, lockAmountInWei1, totalLockedSupply);
      const calcAmount2 = getCalcAmount(rewardAmountInWei, lockAmountInWei2, totalLockedSupply);
      expect(balance1).to.be.equals(mintAmountInWei1.div(2).add(calcAmount1));
      expect(balance2).to.be.equals(mintAmountInWei2.div(2).add(calcAmount2));
    });
  });
  describe("Start vesting -> withdraw -> exit early", () => {
    it("Should be the right receive reward token amount (exit early has no effect)", async () => {
      const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
      const { distributorV2, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      const mintAmountInWei1 = ethers.utils.parseEther("1000");
      const mintAmountInWei2 = ethers.utils.parseEther("2000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, mintAmountInWei1.add(mintAmountInWei2));
      await distributorV2.connect(incentivesControllerSigner).mint(user.address, mintAmountInWei1);
      await distributorV2.connect(incentivesControllerSigner).mint(user2.address, mintAmountInWei2);
      await time.increase(86400 * 28);
      await distributorV2.connect(user).withdraw();
      await distributorV2.connect(user).exitEarly(user.address);
      await distributorV2.connect(user2).withdraw();
      await distributorV2.connect(user2).exitEarly(user2.address);
      const balance1 = await rewardToken.balanceOf(user.address);
      const balance2 = await rewardToken.balanceOf(user2.address);
      expect(balance1).to.be.equals(mintAmountInWei1);
      expect(balance2).to.be.equals(mintAmountInWei2);
    });
  });
  describe("vesting -> get reward", () => {
    it("Should be the right vesting and get reward has not effect", async () => {
      const [, user, user2, incentivesControllerSigner] = await ethers.getSigners();
      const { distributorV2, rewardToken, rewardTokenVaultAddress } = await loadFixture(MultiFeeDistributionV2Fixture);
      await ethers.provider.send('hardhat_setBalance', [rewardTokenVaultAddress, ethers.utils.parseEther('1000').toHexString()]);
      const rewardTokenVaultSigner = await ethers.getImpersonatedSigner(rewardTokenVaultAddress);
      await distributorV2.setMinters([incentivesControllerSigner.address]);
      const mintAmountInWei1 = ethers.utils.parseEther("1000");
      const mintAmountInWei2 = ethers.utils.parseEther("2000");
      await rewardToken.connect(rewardTokenVaultSigner).approve(distributorV2.address, mintAmountInWei1.add(mintAmountInWei2));
      await distributorV2.connect(incentivesControllerSigner).mint(user.address, mintAmountInWei1);
      await distributorV2.connect(incentivesControllerSigner).mint(user2.address, mintAmountInWei2);
      await distributorV2.connect(user).getReward([rewardToken.address]);
      await time.increase(86400 * 10);
      await distributorV2.connect(user).getReward([rewardToken.address]);
      await distributorV2.connect(user2).getReward([rewardToken.address]);
      expect(await rewardToken.balanceOf(user.address)).to.be.equals(0);
      expect(await rewardToken.balanceOf(user2.address)).to.be.equals(0);
      await time.increase(86400 * 20);
      await distributorV2.connect(user).withdraw();
      await distributorV2.connect(user2).withdraw();
      await distributorV2.connect(user).getReward([rewardToken.address]);
      await distributorV2.connect(user2).getReward([rewardToken.address]);
      expect(await rewardToken.balanceOf(user.address)).to.be.equals(mintAmountInWei1);
      expect(await rewardToken.balanceOf(user2.address)).to.be.equals(mintAmountInWei2);
    });
  });
  describe("Cash gap related with teame fee", () => {
    it("Should be not detected", async () => {
      const [, user, user2, teameFeeVault] = await ethers.getSigners();
      const { migration, distributorV2, uToken, stakingToken, stakingTokenHolder, rewardToken, rewardTokenHolder } = await loadFixture(MultiFeeDistributionV2Fixture);
      await distributorV2.setTeamRewardVault(teameFeeVault.address);
      await distributorV2.setTeamRewardFee(5000);
      const lockAmountInWei1 = ethers.utils.parseEther("100");
      const lockAmountInWei2 = ethers.utils.parseEther("200");
      const latest: number = await time.latest();
      const balances1: IMigration.BalanceStruct[] = [{
        amount: lockAmountInWei1,
        validUntil: latest + 86400 * 100,
      }];
      await migration.setDistributor(distributorV2.address);
      await migration.setBalancesBatch([user.address], [balances1]);
      await distributorV2.setMigration(migration.address);
      await stakingToken.connect(stakingTokenHolder).transfer(user2.address, lockAmountInWei2);
      await stakingToken.connect(user2).approve(distributorV2.address, lockAmountInWei2);
      await distributorV2.connect(user2).lock(lockAmountInWei2, user2.address);
      const totalLockedSupply = await distributorV2.totalLockedSupply();
      await distributorV2.addReward(uToken.address);
      const utokenTreasuryAmountInWei1 = ethers.utils.parseEther("1000");
      const utokenTreasuryAmountInWei2 = ethers.utils.parseEther("2000");
      const utokenTreasuryAmountInWei3 = ethers.utils.parseEther("3000");
      await uToken.transfer(distributorV2.address, utokenTreasuryAmountInWei1);
      await distributorV2.getReward([uToken.address]);
      await time.increase(86400 * 7);
      await uToken.transfer(distributorV2.address, utokenTreasuryAmountInWei2);
      await distributorV2.connect(user).getReward([uToken.address]);
      await distributorV2.connect(user2).getReward([uToken.address]);
      await time.increase(86400 * 7);
      await uToken.transfer(distributorV2.address, utokenTreasuryAmountInWei3);
      await distributorV2.connect(user).getReward([uToken.address]);
      await distributorV2.connect(user2).getReward([uToken.address]);
      await time.increase(86400 * 7);
      await distributorV2.connect(user).getReward([uToken.address]);
      await distributorV2.connect(user2).getReward([uToken.address]);
      await time.increase(86400 * 7);
      await distributorV2.connect(user).getReward([uToken.address]);
      await distributorV2.connect(user2).getReward([uToken.address]);
      const teamRewardFee: BigNumber = await distributorV2.teamRewardFee();
      const { adjustedAmount, feeAmount }: AdjustRewardResult = adjustReward(utokenTreasuryAmountInWei1.add(utokenTreasuryAmountInWei2).add(utokenTreasuryAmountInWei3), teamRewardFee);
      const calcAmount1 = getCalcAmount(adjustedAmount, lockAmountInWei1, totalLockedSupply);
      const calcAmount2 = getCalcAmount(adjustedAmount, lockAmountInWei2, totalLockedSupply);
      const balance1 = await uToken.balanceOf(user.address);
      const balance2 = await uToken.balanceOf(user2.address);
      const teameFeeVaultBalance = await uToken.balanceOf(teameFeeVault.address);
      expect(calcAmount1.sub(balance1)).to.be.lte(1);
      expect(calcAmount1.sub(balance1)).to.be.gte(0);
      expect(calcAmount2.sub(balance2)).to.be.lte(1);
      expect(calcAmount2.sub(balance2)).to.be.gte(0);
      expect(teameFeeVaultBalance).to.be.equals(feeAmount);
    });
  });
});
