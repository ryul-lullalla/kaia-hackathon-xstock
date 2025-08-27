// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPriceOracle {
    /// @notice Returns the USD price per 1 token unit, scaled by 1e18.
    /// Example: If 1 TOKEN = $2.50, returns 2.5e18.
    function getPrice(address token) external view returns (uint256);
}


