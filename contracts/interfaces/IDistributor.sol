// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IDistributor {
  struct LockedBalance {
    uint amount;
    uint unlockTime;
  }
  function lockedBalances(address user) view external returns (uint total, uint unlockable, uint locked, LockedBalance[] memory lockData);
  
}
