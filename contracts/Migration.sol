// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract Migration is Ownable {
  struct Balance {
    uint256 amount;
    uint256 validUntil;
  }
  address[] public accounts;
  mapping(address => uint) public accountsIndexes;
  mapping(address => Balance[]) public accountBalances;

  function balanceOf(address account) external view returns(uint) {
    uint total = 0;
    for (uint i = 0; i < accountBalances[account].length; i++) {
      if (accountBalances[account][i].validUntil > block.timestamp) {
        total += accountBalances[account][i].amount;
      }
    }
    return total;
  }

  function totalSupply() external view returns(uint) {
    uint total = 0;
    for (uint i = 0; i < accounts.length; i++) {
      for (uint j = 0; j < accountBalances[accounts[i]].length; j++) {
        if (accountBalances[accounts[i]][j].validUntil > block.timestamp) {
          total += accountBalances[accounts[i]][j].amount;
        }
      }
    }
    return total;
  }

  function setBalances(address account, Balance[] calldata balances) external onlyOwner {
    if (accountBalances[account].length > 0) {
      delete accountBalances[account];
    }
    for (uint i = 0; i < balances.length; i++) {
      accountBalances[account].push(balances[i]);
    }
    if (accountsIndexes[account] == 0) {
      accounts.push(account);
      accountsIndexes[account] = accounts.length;
    }
  }

  function removeBalances(address account) external onlyOwner {
    delete accountBalances[account];
    if (accountsIndexes[account] > 0) {
      accounts[accountsIndexes[account] - 1] = accounts[accounts.length - 1];
      accountsIndexes[accounts[accounts.length - 1]] = accountsIndexes[account];
      accountsIndexes[account] = 0;
      accounts.pop();
    }
  }

  function setBalancesBatch(address[] calldata _accounts, Balance[][] calldata _balancesBatch) external onlyOwner {
    require(_accounts.length > 0, 'accounts array must not be empty');
    require(_balancesBatch.length > 0, 'balancesBatch array must not be empty');
    require(_accounts.length == _balancesBatch.length, 'accounts and balances array must be the same length');
    for (uint i = 0; i < _accounts.length; i++) {
      address account = _accounts[i];
      if (accountBalances[account].length > 0) {
        delete accountBalances[account];
      }
      Balance[] memory balances = _balancesBatch[i];
      for (uint j = 0; j < balances.length; j++) {
        accountBalances[account].push(balances[i]);
      }
      if (accountsIndexes[account] == 0) {
        accounts.push(account);
        accountsIndexes[account] = accounts.length;
      }
    }
  }

  function removeBalancesBatch(address[] calldata _accounts) external onlyOwner {
    require(_accounts.length > 0, 'accounts array must not be empty');
    for (uint i = 0; i < _accounts.length; i++) {
      address account = _accounts[i];
      delete accountBalances[account];
      if (accountsIndexes[account] > 0) {
        accounts[accountsIndexes[account] - 1] = accounts[accounts.length - 1];
        accountsIndexes[accounts[accounts.length - 1]] = accountsIndexes[account];
        accountsIndexes[account] = 0;
        accounts.pop();
      }
    }
  }

  function accountsLength() external view returns(uint) {
    return accounts.length;
  }
}