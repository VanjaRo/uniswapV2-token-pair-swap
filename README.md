# Working with UniswapV2

The aim of this project is to get main flow of Blockchain develpment using hardhat.

## Core goals

- Create a token (I inherited main logic from OpenZeppelin's ERC20 contract)
- Deploy the token to mainnet fork (I used **infura** as an RPC provider)
- Create a UniswapV2 pair for this token (I used **USDC** as a second token)
- Swap tokens using the pair

## Before start

- Fill all the required fields in **.env.example** file and run `mv .env.example .env` in ypur terminal

## Start

- Run `npm install` in your terminal to get all the dependencies
- Run `npx hardhat test` to check how everything works

## Output example

```cmd
Deployment
      ✔ 'owner' of the FooToken should have balance equal to token total supply  (7640ms)
      ✔ should assign 1 USDC token to the owner
    Swapping
–– Creating new UniswapV2Pair
–– Adding liquidity to UniswapV2Pair via UniswapV2Router
–– Trying to exchange FOOT token to USDC
Foo Balance before exchange: 90000000
USDC Balance before exchange: 0
Foo Balance after: 89990000
USDC Balance after: 9960
      ✔ Should successfully swap FOOT token to USDC in FOOT/USDC pair
```
