// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockSGE
 * @notice A minimal ERC-20 for testing the SGE distribution system.
 *         Mints an initial supply to the deployer.
 */
contract MockSGE is ERC20 {
    constructor(uint256 initialSupply) ERC20("Scalable Green Energy", "SGE") {
        _mint(msg.sender, initialSupply);
    }
}

/**
 * @title MockERC20
 * @notice A second mock token for rescue / non-SGE scenarios.
 */
contract MockERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) ERC20(name_, symbol_) {
        _mint(msg.sender, initialSupply);
    }
}
