// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract CollateralVault is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token; // e.g., USDT

    mapping(address => uint256) public balanceOf;

    address public controller; 

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, address indexed to);
    event ControllerUpdated(address indexed controller);
    event Seized(address indexed from, uint256 amount, address indexed to);

    constructor(IERC20 token_) Ownable(msg.sender) {
        token = token_;
    }

    function collateralToken() external view returns (address) {
        return address(token);
    }

    function deposit(uint256 amount, address onBehalfOf) external {
        require(amount > 0, "amount=0");
        token.safeTransferFrom(msg.sender, address(this), amount);
        balanceOf[onBehalfOf] += amount;
        emit Deposited(onBehalfOf, amount);
    }

    function withdraw(uint256 amount, address to) external {
        require(amount > 0, "amount=0");
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        token.safeTransfer(to, amount);
        emit Withdrawn(msg.sender, amount, to);
    }

    function setController(address controller_) external onlyOwner {
        controller = controller_;
        emit ControllerUpdated(controller_);
    }

    function seize(address from, uint256 amount, address to) external {
        require(msg.sender == controller, "unauthorized");
        require(balanceOf[from] >= amount, "insufficient");
        balanceOf[from] -= amount;
        token.safeTransfer(to, amount);
        emit Seized(from, amount, to);
    }
}


