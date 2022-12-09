// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMigration.sol";
import "hardhat/console.sol";

interface IDistributor {
  function updateReward(address account) external;
}

contract Migration is IMigration, Ownable {
  IDistributor public distributor;
  address public updater;
  address[] public accounts;
  mapping(address => uint) public accountsIndexes;
  mapping(address => Balance[]) public accountBalances;

  function balanceOf(address account) public view returns(uint) {
    uint balance = 0;
    for (uint i = 0; i < accountBalances[account].length; i++) {
      balance += accountBalances[account][i].amount;
    }
    return balance;
  }

  function totalSupply() external view returns(uint) {
    uint total = 0;
    for (uint i = 0; i < accounts.length; i++) {
      for (uint j = 0; j < accountBalances[accounts[i]].length; j++) {
        total += accountBalances[accounts[i]][j].amount;
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
        accountBalances[account].push(balances[j]);
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

  function _removeExpiredBalances(address account) private {
    for (uint i = 0; i < accountBalances[account].length; i++) {
      if (accountBalances[account][i].validUntil < block.timestamp) {
        delete accountBalances[account][i];
      }
    }
  }

  function setDistributor(IDistributor _distributor) external onlyOwner {
    distributor = _distributor;
  }

  function setUpdater(address _updater) external onlyOwner {
    updater = _updater;
  }

  function update(address account) external onlyUpdater {
    if(address(distributor) != address(0)) {
      distributor.updateReward(account);
      _removeExpiredBalances(account);
    }
  }

  modifier onlyUpdater() {
    require(msg.sender == updater, 'only updater');
    _;
  }
}
