pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FooToken is ERC20 {
    constructor(uint amount) ERC20("FooToken", "FOOT") {
        _mint(msg.sender, amount);
    }
}
