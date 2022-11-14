import { INCENTIVES_CONTROLLER, MAX_MINTABLE, POOL_CONFIGURATOR, REWARDS_PER_SECOND, START_TIME_OFFSET, incentivesController2Fixture } from "./fixtures/incentives-controller-v2.fixture";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

import { BigNumber } from "ethers";
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
  describe("Setters", () => {});
});
