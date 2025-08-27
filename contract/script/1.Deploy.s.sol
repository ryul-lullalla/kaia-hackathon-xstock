// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {kxStock} from "../src/kxStock.sol";
import {CollateralVault} from "../src/CollateralVault.sol";
import {LendingVault} from "../src/LendingVault.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {SimplePriceOracle} from "../src/SimplePriceOracle.sol";
import {console2} from "forge-std/console2.sol";

contract Deploy is Script {
    address public tester = address(0xCf68Abda4f1D1058cF9a59C553688D2B6850A505);
    function run() public {
        vm.startBroadcast();

        // Deploy the tokens
        MockUSDT usdt = new MockUSDT("MockUSDT", "MUSDT");
        kxStock kxApple = new kxStock("kxApple", "KXAPPLE");

        kxApple.mint(msg.sender, 100_000e18);
        usdt.mint(msg.sender, 100_000e18);

        kxApple.mint(tester, 100_000e18);
        usdt.mint(tester, 100_000e18);

        SimplePriceOracle priceOracle = new SimplePriceOracle();
        priceOracle.setPrice(address(kxApple), 228.36e18);
        priceOracle.setPrice(address(usdt), 1e18);
        CollateralVault collateralVault = new CollateralVault(usdt);
        LendingVault lendingVault = new LendingVault(kxApple);
        collateralVault.setController(address(lendingVault));
        lendingVault.setIntegrations(address(collateralVault), address(priceOracle));

        // Deposit collateral
        usdt.approve(address(collateralVault), 100_000e18);
        collateralVault.deposit(100_000e18, msg.sender);
        kxApple.approve(address(lendingVault), 100e18);
        lendingVault.deposit(100e18, msg.sender);

        console2.log("Mock USDT", address(usdt));
        console2.log("kxApple", address(kxApple));
        console2.log("collateralVault", address(collateralVault));
        console2.log("lendingVault", address(lendingVault));
        console2.log("priceOracle", address(priceOracle)); 

        lendingVault.borrow(1e18);

        vm.stopBroadcast();
    }
}