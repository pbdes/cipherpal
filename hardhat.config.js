require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  paths: {
      artifacts: "./src",
  },
  networks: {
      zkEVM: {
      url: `https://rpc.cardona.zkevm-rpc.com`,
      accounts: [process.env.REACT_APP_ACCOUNT_PRIVATE_KEY],
      },
  },
};
