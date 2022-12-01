import { ethers } from "hardhat";

const FOO_TOKEN_AMOUNT_TO_MINT = 1e8;

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const FooToken = await ethers.getContractFactory("FooToken");
  const fooToken = await FooToken.deploy(FOO_TOKEN_AMOUNT_TO_MINT);

  console.log("Token address:", fooToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
