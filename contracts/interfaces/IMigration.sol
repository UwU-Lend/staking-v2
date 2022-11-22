// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMigration {
  function balanceOf(address account) external view returns(uint);
  function totalSupply() external view returns(uint);
}