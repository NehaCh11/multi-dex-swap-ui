🚀 Multi-DEX Swap Frontend (ParaSwap DexLib)
📝 Introduction
This project is a React-based frontend for ParaSwap DexLib, an open-source library that aggregates decentralized exchanges (DEXes) to find the best swap rates and lowest fees.
Users can connect their wallet, enter token details, and fetch swap quotes using ParaSwap’s aggregation logic.

✨ Features
🔗 Connect wallet (MetaMask or similar)
🪙 Enter source and destination token addresses
💸 Input swap amount (in smallest units, e.g., wei for ETH)
📈 Fetch best swap quote and route via ParaSwap
📝 (Optional) Execute swap transaction (requires mainnet funds)
⚡️ Setup & Execution Steps
Install Dependencies

(Run in the multi-dex-swap-ui directory)

Start the Frontend

(Opens the app at http://localhost:5173)

Connect Wallet

Use MetaMask or another browser wallet.
Switch to Ethereum mainnet for real quotes.
Enter Swap Details

ETH address: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
USDC address: 0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
Amount: 10000000000000000 (0.01 ETH in wei)
Get Quote

Click Get Quote to fetch the best rate and route.
Execute Swap

Click Swap to build and send the transaction (requires mainnet funds).
🖥️ Demo Notes
You can show the UI flow and error handling without mainnet funds.
Actual swap execution requires real tokens and ETH for gas.
💡 Conclusive Thoughts
ParaSwap DexLib enables seamless DEX aggregation and swap execution.
This frontend demonstrates wallet connection, quote fetching, and integration logic.
For full swap functionality, mainnet funds are required.
