// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICollateralVault {
    function token() external view returns (address);
    function collateralToken() external view returns (address);
    function balanceOf(address user) external view returns (uint256);

    function deposit(uint256 amount, address onBehalfOf) external;
    function withdraw(uint256 amount, address to) external;

    // liquidation controls
    function setController(address controller_) external;
    function seize(address from, uint256 amount, address to) external;
}


