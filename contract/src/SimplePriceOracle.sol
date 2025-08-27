// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

contract SimplePriceOracle is IPriceOracle, Ownable {
    // token => price in 1e18 USD per 1 token
    mapping(address => uint256) public prices;

    event PriceUpdated(address indexed token, uint256 priceE18);

    constructor() Ownable(msg.sender) {}

    function setPrice(address token, uint256 priceE18) external onlyOwner {
        require(token != address(0), "token=0");
        require(priceE18 > 0, "price=0");
        prices[token] = priceE18;
        emit PriceUpdated(token, priceE18);
    }

    function getPrice(address token) external view returns (uint256) {
        uint256 p = prices[token];
        require(p > 0, "no price");
        return p;
    }
}


