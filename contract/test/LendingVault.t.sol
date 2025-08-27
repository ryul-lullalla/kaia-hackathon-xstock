// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {LendingVault} from "../src/LendingVault.sol";
import {CollateralVault} from "../src/CollateralVault.sol";
import {SimplePriceOracle} from "../src/SimplePriceOracle.sol";
import {KXStock} from "../src/kxStock.sol";

contract LendingVaultTest is Test {
    KXStock internal assetToken;        // underlying of ERC4626 vault
    KXStock internal collateralToken;   // collateral held in CollateralVault

    LendingVault internal vault;
    CollateralVault internal colVault;
    SimplePriceOracle internal oracle;

    address internal lp = address(0xA11CE);      // liquidity provider
    address internal borrower = address(0xB0B);  // borrower
    address internal liquidator = address(0xC0FFEE);

    function setUp() public {
        // Deploy tokens
        assetToken = new KXStock();
        collateralToken = new KXStock();

        // Deploy core contracts
        vault = new LendingVault(IERC20(address(assetToken)));
        colVault = new CollateralVault(IERC20(address(collateralToken)));
        oracle = new SimplePriceOracle();

        // Wire integrations
        vm.prank(vault.owner());
        vault.setIntegrations(address(colVault), address(oracle));
        vm.prank(colVault.owner());
        colVault.setController(address(vault));

        // Set prices (1 token = $1)
        vm.startPrank(oracle.owner());
        oracle.setPrice(address(assetToken), 1e18);
        oracle.setPrice(address(collateralToken), 1e18);
        vm.stopPrank();

        // Fund LP with assets and deposit into vault
        assetToken.mint(lp, 100_000e18);
        vm.startPrank(lp);
        assetToken.approve(address(vault), type(uint256).max);
        vault.deposit(50_000e18, lp); // provide liquidity
        vm.stopPrank();

        // Fund borrower with collateral and deposit to collateral vault
        collateralToken.mint(borrower, 10_000e18);
        vm.startPrank(borrower);
        collateralToken.approve(address(colVault), type(uint256).max);
        colVault.deposit(5_000e18, borrower);
        vm.stopPrank();

        // Configure risk/liquidity params
        vm.prank(vault.owner());
        vault.setRiskParams(8000, 8500, 500); // ltv 80%, liq threshold 85%, bonus 5%
        vm.prank(vault.owner());
        vault.setLiquidityParams(0, 0); // no borrow cap, no min cash
    }

    function test_borrowWithinLTV_succeedsAndHealthy() public {
        // Borrower borrows up to 80% of collateral value (prices are both 1e18)
        // Collateral value = 5,000; Max borrow = 4,000
        vm.startPrank(borrower);
        vault.borrow(3_000e18);
        vm.stopPrank();

        // Debt increased
        uint256 debt = vault.debtOf(borrower);
        assertEq(debt, 3_000e18, "debt");

        // Vault liquid reduced
        uint256 liquid = IERC20(vault.asset()).balanceOf(address(vault));
        assertEq(liquid, 50_000e18 - 3_000e18, "vault cash");

        // Healthy at liq threshold (collateral 5,000 * 85% = 4,250 > 3,000)
        bool healthy = vault.isHealthy(borrower);
        assertTrue(healthy, "should be healthy");
    }

    function test_previewAccruedInterest_global_and_user() public {
        // Borrow some
        vm.startPrank(borrower);
        vault.borrow(2_000e18);
        vm.stopPrank();

        // Immediately after borrow, pending interest ~0
        assertEq(vault.previewAccruedInterest(), 0);
        assertEq(vault.previewAccruedInterestOf(borrower), 0);

        // Fast forward time to accrue interest
        vm.warp(block.timestamp + 7 days);

        uint256 pending = vault.previewAccruedInterest();
        assertGt(pending, 0, "pending interest > 0");

        uint256 userPending = vault.previewAccruedInterestOf(borrower);
        assertGt(userPending, 0, "user pending > 0");
        assertLe(userPending, pending, "user share <= total");
    }

    function test_previewLenderAccruedInterest_sharesProRata() public {
        // Two LPs deposit different amounts
        address lp2 = address(0xBEEF);
        assetToken.mint(lp2, 100_000e18);
        vm.startPrank(lp2);
        assetToken.approve(address(vault), type(uint256).max);
        vault.deposit(50_000e18, lp2);
        vm.stopPrank();

        // Borrower borrows within LTV to generate interest
        vm.startPrank(borrower);
        vault.borrow(3_000e18);
        vm.stopPrank();

        vm.warp(block.timestamp + 3 days);

        uint256 pending = vault.previewAccruedInterest();
        uint256 lp1Share = vault.previewLenderAccruedInterestOf(lp);
        uint256 lp2Share = vault.previewLenderAccruedInterestOf(lp2);
        // Sum of users' shares should be close to pending (allow small rounding slack)
        assertApproxEqAbs(lp1Share + lp2Share, pending, 2);

        // Proportional to shares: both LPs have equal shares deposited (50k each)
        assertApproxEqAbs(lp1Share, lp2Share, 1);
    }

    function test_borrowExceedLTV_reverts() public {
        vm.startPrank(borrower);
        vm.expectRevert();
        vault.borrow(5_000e18); // equals collateral, exceeds 80% LTV
        vm.stopPrank();
    }

    function test_minCash_enforced() public {
        // Set minCash to 49,000 so only 1,000 can be borrowed
        vm.prank(vault.owner());
        vault.setLiquidityParams(0, 49_000e18);

        vm.startPrank(borrower);
        // borrow that would leave cash below minCash should revert
        vm.expectRevert(bytes("insufficient liquidity"));
        vault.borrow(2_000e18);
        // but 1,000 should pass
        vault.borrow(1_000e18);
        vm.stopPrank();
    }

    function test_liquidation_flow() public {
        // 1) Borrow some amount
        vm.startPrank(borrower);
        vault.borrow(3_000e18);
        vm.stopPrank();

        // 2) Price of collateral drops to $0.70 → unhealthy at 85% threshold
        vm.prank(oracle.owner());
        oracle.setPrice(address(collateralToken), 7e17); // $0.70
        assertFalse(vault.isHealthy(borrower), "should be unhealthy");

        // 3) Liquidator repays 1,000 and seizes collateral with 5% bonus
        assetToken.mint(liquidator, 2_000e18);
        vm.startPrank(liquidator);
        assetToken.approve(address(vault), type(uint256).max);
        uint256 colBefore = colVault.balanceOf(borrower);
        uint256 debtBefore = vault.debtOf(borrower);

        vault.liquidate(borrower, 1_000e18, liquidator);

        uint256 debtAfter = vault.debtOf(borrower);
        uint256 colAfter = colVault.balanceOf(borrower);
        assertEq(debtAfter, debtBefore - 1_000e18, "debt reduced");

        // Expected seize amount = repayUSD*(1+bonus)/colPrice
        // repayUSD = 1,000 * $1 = 1,000; bonus 5% → 1,050; colPrice $0.70 → seize = 1,500
        assertEq(colBefore - colAfter, 1_500e18, "seized amount");
        vm.stopPrank();
    }

    function test_borrowCap_enforced() public {
        // Set borrow cap small, then try to exceed
        vm.prank(vault.owner());
        vault.setLiquidityParams(500e18, 0);

        vm.startPrank(borrower);
        vault.borrow(400e18);
        vm.expectRevert(bytes("cap"));
        vault.borrow(200e18); // would exceed 500 cap
        vm.stopPrank();
    }
}


