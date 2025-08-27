// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ICollateralVault} from "./interfaces/ICollateralVault.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";

interface ICollateralSeizer {
    function seize(address from, uint256 amount, address to) external;
}

contract LendingVault is ERC4626, Ownable, ReentrancyGuard {
    using Math for uint256;
    using SafeERC20 for IERC20;

    // totalBorrows accrues interest over time via borrowIndex
    uint256 public totalBorrows;
    uint256 public borrowIndex; // 1e18 scale
    uint64 public lastAccrual;
    // Utilization-based interest model (all 1e18 scale)
    uint256 public baseRatePerSecond;   // base rate at 0 utilization
    uint256 public slope1PerSecond;     // slope up to kink utilization
    uint256 public slope2PerSecond;     // additional slope beyond optimal
    uint256 public optimalUtilization;  // e.g., 0.8e18 = 80%

    uint256 public constant SECONDS_PER_YEAR = 365 days;

    mapping(address => uint256) public principalScaled; // borrower => principal * 1e18 / borrowIndex

    // Risk/Oracle/Collateral
    ICollateralVault public collateral;
    IPriceOracle public oracle;
    uint256 public ltvBps = 8000; // 80%
    uint256 public liqThresholdBps = 8500; // 85%
    uint256 public liqBonusBps = 500; // 5%
    uint256 public borrowCap; // optional cap on total borrows
    uint256 public minCash; // liquidity buffer in asset units

    constructor(IERC20 asset_)
        ERC20("KX Lending Vault", "kxLV")
        ERC4626(asset_)
        Ownable(msg.sender)
    {
        borrowIndex = 1e18;
        lastAccrual = uint64(block.timestamp);
        // Default parameters (~2% base + 18% slope1 up to 80% util; +150% slope2 after)
        // Convert APR (1e18) to per-second (1e18): perSecond = APR / SECONDS_PER_YEAR
        baseRatePerSecond  = uint256(2e16)  / SECONDS_PER_YEAR;   // 2% APR
        slope1PerSecond    = uint256(18e16) / SECONDS_PER_YEAR;   // +18% APR up to kink
        slope2PerSecond    = uint256(150e16)/ SECONDS_PER_YEAR;   // +150% APR after kink
        optimalUtilization = 8e17; // 80%

        ltvBps = 8000;
        liqThresholdBps = 8500;
        liqBonusBps = 500;
        borrowCap = type(uint256).max;
        minCash = 0;
    }

    event RiskParamsUpdated(uint256 ltvBps, uint256 liqThresholdBps, uint256 liqBonusBps);
    event LiquidityParamsUpdated(uint256 borrowCap, uint256 minCash);
    event IntegrationUpdated(address collateral, address oracle);

    function setIntegrations(address collateral_, address oracle_) external onlyOwner {
        collateral = ICollateralVault(collateral_);
        oracle = IPriceOracle(oracle_);
        emit IntegrationUpdated(collateral_, oracle_);
    }

    function setRiskParams(uint256 _ltvBps, uint256 _liqThresholdBps, uint256 _liqBonusBps) external onlyOwner {
        require(_ltvBps <= _liqThresholdBps && _liqThresholdBps <= 9500, "invalid thresholds");
        ltvBps = _ltvBps;
        liqThresholdBps = _liqThresholdBps;
        liqBonusBps = _liqBonusBps;
        emit RiskParamsUpdated(_ltvBps, _liqThresholdBps, _liqBonusBps);
    }

    function setLiquidityParams(uint256 _borrowCap, uint256 _minCash) external onlyOwner {
        borrowCap = _borrowCap;
        minCash = _minCash;
        emit LiquidityParamsUpdated(_borrowCap, _minCash);
    }

    event RateParamsUpdated(
        uint256 baseRatePerSecond,
        uint256 slope1PerSecond,
        uint256 slope2PerSecond,
        uint256 optimalUtilization
    );

    function setRateParams(
        uint256 basePerSec,
        uint256 slope1PerSec,
        uint256 slope2PerSec,
        uint256 optimalU
    ) external onlyOwner {
        require(optimalU <= 1e18, "optimal>1e18");
        baseRatePerSecond = basePerSec;
        slope1PerSecond = slope1PerSec;
        slope2PerSecond = slope2PerSec;
        optimalUtilization = optimalU;
        emit RateParamsUpdated(basePerSec, slope1PerSec, slope2PerSec, optimalU);
    }

    function _utilization(uint256 cash, uint256 borrows) internal pure returns (uint256) {
        if (borrows == 0) return 0;
        uint256 denom = cash + borrows;
        if (denom == 0) return 0;
        return (borrows * 1e18) / denom;
    }

    function _currentRatePerSecond(uint256 cash, uint256 borrows) internal view returns (uint256) {
        uint256 u = _utilization(cash, borrows); // 1e18 scale
        if (u <= optimalUtilization) {
            // Linear region up to optimal: base + slope1 * u
            return baseRatePerSecond + (slope1PerSecond * u) / 1e18;
        }
        // Above optimal: base + slope1 * optimal + slope2 * (u - optimal)
        uint256 rateAtOptimal = baseRatePerSecond + (slope1PerSecond * optimalUtilization) / 1e18;
        uint256 excess = u - optimalUtilization;
        return rateAtOptimal + (slope2PerSecond * excess) / 1e18;
    }

    function _assetPriceE18() internal view returns (uint256) {
        return oracle.getPrice(asset());
    }

    function _collateralToken() internal view returns (address) {
        return collateral.collateralToken();
    }

    function _collateralPriceE18() internal view returns (uint256) {
        return oracle.getPrice(_collateralToken());
    }

    function debtOf(address user) public view returns (uint256) {
        // principal with interest in asset units
        uint256 principal = principalScaled[user].mulDiv(borrowIndex, 1e18);
        return principal;
    }

    function debtValueE18(address user) public view returns (uint256) {
        uint256 d = debtOf(user);
        if (d == 0) return 0;
        return d.mulDiv(_assetPriceE18(), 1e18);
    }

    // Pending (unaccounted) interest since lastAccrual in asset units
    function previewAccruedInterest() public view returns (uint256) {
        uint256 preview = _previewTotalBorrows();
        return preview > totalBorrows ? preview - totalBorrows : 0;
    }

    // Borrower share of pending interest in asset units
    function previewAccruedInterestOf(address user) public view returns (uint256) {
        uint256 pending = previewAccruedInterest();
        if (pending == 0) return 0;
        uint256 userDebt = debtOf(user);
        if (userDebt == 0) return 0;
        // Pro-rata pending interest by current debt share
        return pending.mulDiv(userDebt, totalBorrows);
    }

    // Lender helpers
    function assetsOf(address user) public view returns (uint256) {
        return convertToAssets(balanceOf(user));
    }

    function previewLenderAccruedInterestOf(address user) public view returns (uint256) {
        uint256 pending = previewAccruedInterest();
        if (pending == 0) return 0;
        uint256 userShares = balanceOf(user);
        if (userShares == 0) return 0;
        uint256 supply = totalSupply();
        if (supply == 0) return 0;
        return pending.mulDiv(userShares, supply);
    }

    function collateralAmount(address user) public view returns (uint256) {
        return collateral.balanceOf(user) * 1e18 / 10 ** IERC20Metadata(collateral.token()).decimals();
    }

    function collateralValueE18(address user) public view returns (uint256) {
        uint256 amt = collateralAmount(user);
        if (amt == 0) return 0;
        return amt.mulDiv(_collateralPriceE18(), 1e18);
    }

    function isHealthy(address user) public view returns (bool) {
        uint256 col = collateralValueE18(user);
        uint256 debt = debtValueE18(user);
        return col * liqThresholdBps / 1e4 >= debt;
    }

    // View preview of accrued borrows
    function _previewTotalBorrows() internal view returns (uint256) {
        if (block.timestamp == lastAccrual || totalBorrows == 0) {
            return totalBorrows;
        }
        uint256 cash = IERC20(asset()).balanceOf(address(this));
        uint256 dt = block.timestamp - lastAccrual;
        uint256 rPerSec = _currentRatePerSecond(cash, totalBorrows);
        uint256 interest = totalBorrows.mulDiv(rPerSec * dt, 1e18);
        return totalBorrows + interest;
    }

    // ERC4626 override: include on-loan assets
    function totalAssets() public view override returns (uint256) {
        uint256 cash = IERC20(asset()).balanceOf(address(this));
        return cash + _previewTotalBorrows();
    }

    // Liquidity-aware withdrawal caps
    function maxWithdraw(address owner_) public view override returns (uint256) {
        uint256 liquid = IERC20(asset()).balanceOf(address(this));
        uint256 ownerAssets = convertToAssets(balanceOf(owner_));
        return liquid < ownerAssets ? liquid : ownerAssets;
    }

    function maxRedeem(address owner_) public view override returns (uint256) {
        uint256 liquid = IERC20(asset()).balanceOf(address(this));
        uint256 sharesForLiquid = convertToShares(liquid);
        uint256 ownerShares = balanceOf(owner_);
        return sharesForLiquid < ownerShares ? sharesForLiquid : ownerShares;
    }

    // State-mutating accrual
    function _accrue() internal {
        if (block.timestamp == lastAccrual || totalBorrows == 0) {
            lastAccrual = uint64(block.timestamp);
            return;
        }
        uint256 dt = block.timestamp - lastAccrual;
        uint256 cash = IERC20(asset()).balanceOf(address(this));
        uint256 rPerSec = _currentRatePerSecond(cash, totalBorrows); // 1e18 scale
        uint256 interestFactor = rPerSec * dt; // 1e18 scale
        uint256 interestAccrued = totalBorrows.mulDiv(interestFactor, 1e18);
        totalBorrows += interestAccrued;
        borrowIndex += borrowIndex.mulDiv(interestFactor, 1e18);
        lastAccrual = uint64(block.timestamp);
    }

    // Permissionless borrow with health checks and CEI
    function borrow(uint256 assets) external nonReentrant {
        require(address(collateral) != address(0) && address(oracle) != address(0), "not integrated");
        require(assets > 0, "amount=0");
        _accrue();
        uint256 liquid = IERC20(asset()).balanceOf(address(this));
        require(liquid >= assets + minCash, "insufficient liquidity");
        if (borrowCap != 0) {
            require(totalBorrows + assets <= borrowCap, "cap");
        }
        // Health check (LTV after borrow <= ltvBps)
        uint256 colE18 = collateralValueE18(msg.sender);
        uint256 curDebtE18 = debtValueE18(msg.sender);
        uint256 addDebtE18 = assets.mulDiv(_assetPriceE18(), 1e18);
        require(colE18 * ltvBps / 1e4 >= curDebtE18 + addDebtE18, "LTV");
        // Effects
        totalBorrows += assets;
        principalScaled[msg.sender] += assets.mulDiv(1e18, borrowIndex);
        // Interactions
        IERC20(asset()).safeTransfer(msg.sender, assets);
    }

    function repay(uint256 assets, address onBehalfOf) external nonReentrant {
        require(assets > 0, "amount=0");
        _accrue();
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
        uint256 principalWithInterest = principalScaled[onBehalfOf].mulDiv(borrowIndex, 1e18);
        uint256 repayAmount = assets < principalWithInterest ? assets : principalWithInterest;
        uint256 newScaled = principalWithInterest - repayAmount;
        principalScaled[onBehalfOf] = newScaled == 0 ? 0 : newScaled.mulDiv(1e18, borrowIndex);
        totalBorrows -= repayAmount;
    }

    // Liquidation: repay borrower's debt and seize collateral at bonus
    function liquidate(address borrower, uint256 repayAssets, address seizeTo) external nonReentrant {
        require(address(collateral) != address(0) && address(oracle) != address(0), "not integrated");
        require(repayAssets > 0, "amount=0");
        _accrue();
        // must be unhealthy
        uint256 col = collateralValueE18(borrower);
        uint256 debt = debtValueE18(borrower);
        require(col * liqThresholdBps / 1e4 < debt, "healthy");
        // pull repay
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), repayAssets);
        // compute seize amount
        uint256 repayE18 = repayAssets.mulDiv(_assetPriceE18(), 1e18);
        uint256 seizeE18 = repayE18 * (1e4 + liqBonusBps) / 1e4;
        uint256 seizeAmt = seizeE18.mulDiv(1e18, _collateralPriceE18());
        // reduce debt
        uint256 principalWithInterest = principalScaled[borrower].mulDiv(borrowIndex, 1e18);
        uint256 actualRepay = repayAssets < principalWithInterest ? repayAssets : principalWithInterest;
        uint256 newScaled = principalWithInterest - actualRepay;
        principalScaled[borrower] = newScaled == 0 ? 0 : newScaled.mulDiv(1e18, borrowIndex);
        totalBorrows -= actualRepay;
        // seize collateral to liquidator
        ICollateralSeizer(address(collateral)).seize(borrower, seizeAmt, seizeTo);
    }
}