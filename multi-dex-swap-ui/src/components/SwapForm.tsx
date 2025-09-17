import React, { useState } from "react";
import { getQuote, executeSwap } from "../lib/dexlib";
import { ethers } from "ethers";
import type { OptimalRate } from "@paraswap/sdk";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}

// Common token addresses on Ethereum Mainnet - verified with ParaSwap
const COMMON_TOKENS = {
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeEeeeEeee",
  USDC: "0xA0b86a33E6417bE50d7Ce7e6c96b6e3c03b58c7D", // USDC on Ethereum
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Tether USD
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",  // Dai Stablecoin
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // Wrapped Ether
};

const SwapForm: React.FC = () => {
  const [fromToken, setFromToken] = useState<string>(COMMON_TOKENS.WETH);
  const [toToken, setToToken] = useState<string>(COMMON_TOKENS.USDT);
  const [amount, setAmount] = useState<string>("");
  const [quote, setQuote] = useState<OptimalRate | null>(null);

  const handleQuote = async () => {
    try {
      // Validate inputs
      if (!fromToken || !toToken || !amount) {
        alert("Please fill in all fields");
        return;
      }

      if (parseFloat(amount) <= 0) {
        alert("Please enter a valid amount");
        return;
      }

      if (!window.ethereum) {
        alert("Connect wallet first!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Convert amount to wei/proper decimals
      let amountInWei: string;
      if (fromToken === COMMON_TOKENS.ETH || fromToken === COMMON_TOKENS.WETH) {
        // For ETH and WETH, convert to wei
        amountInWei = ethers.parseEther(amount).toString();
      } else if (fromToken === COMMON_TOKENS.USDC) {
        // USDC has 6 decimals
        amountInWei = ethers.parseUnits(amount, 6).toString();
      } else if (fromToken === COMMON_TOKENS.USDT) {
        // USDT has 6 decimals
        amountInWei = ethers.parseUnits(amount, 6).toString();
      } else {
        // For other ERC-20 tokens, assume 18 decimals
        amountInWei = ethers.parseUnits(amount, 18).toString();
      }

      // Normalize token addresses to lowercase
      const normalizedFromToken = fromToken.toLowerCase();
      const normalizedToToken = toToken.toLowerCase();

      console.log("Getting quote with params:", {
        srcToken: normalizedFromToken,
        destToken: normalizedToToken,
        amount: amountInWei,
        userAddress,
      });

      const q = await getQuote(normalizedFromToken, normalizedToToken, amountInWei, userAddress);
      
      if (q && typeof q === 'object' && !('error' in q)) {
        setQuote(q as OptimalRate);
        console.log("Quote received:", q);
      } else {
        setQuote(null);
        console.error("Invalid quote received:", q);
      }
    } catch (err) {
      console.error("Quote error:", err);
      setQuote(null);
      alert(`Quote error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSwap = async () => {
    try {
      if (!fromToken || !toToken || !amount) {
        alert("Please fill in all fields and get a quote first");
        return;
      }

      if (!window.ethereum) {
        alert("Connect wallet first!");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Convert amount to wei/proper decimals
      let amountInWei: string;
      if (fromToken === COMMON_TOKENS.ETH || fromToken === COMMON_TOKENS.WETH) {
        amountInWei = ethers.parseEther(amount).toString();
      } else if (fromToken === COMMON_TOKENS.USDC || fromToken === COMMON_TOKENS.USDT) {
        amountInWei = ethers.parseUnits(amount, 6).toString();
      } else {
        amountInWei = ethers.parseUnits(amount, 18).toString();
      }

      const normalizedFromToken = fromToken.toLowerCase();
      const normalizedToToken = toToken.toLowerCase();

      const txHash = await executeSwap(normalizedFromToken, normalizedToToken, amountInWei, userAddress, signer);
      alert(`Swap executed: ${txHash}`);
    } catch (err) {
      console.error("Swap error:", err);
      alert(`Swap error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatTokenAmount = (amount: string, decimals: number = 18): string => {
    try {
      return ethers.formatUnits(amount, decimals);
    } catch {
      return amount;
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">From Token</label>
        <select
          value={fromToken}
          onChange={(e) => setFromToken(e.target.value)}
          className="border p-2 w-full mb-2"
        >
          <option value={COMMON_TOKENS.WETH}>WETH</option>
          <option value={COMMON_TOKENS.USDT}>USDT</option>
          <option value={COMMON_TOKENS.DAI}>DAI</option>
          <option value={COMMON_TOKENS.ETH}>ETH</option>
        </select>
        <input
          type="text"
          value={fromToken}
          onChange={(e) => setFromToken(e.target.value)}
          placeholder="Or enter custom token address"
          className="border p-2 w-full text-xs"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">To Token</label>
        <select
          value={toToken}
          onChange={(e) => setToToken(e.target.value)}
          className="border p-2 w-full mb-2"
        >
          <option value={COMMON_TOKENS.USDT}>USDT</option>
          <option value={COMMON_TOKENS.WETH}>WETH</option>
          <option value={COMMON_TOKENS.DAI}>DAI</option>
          <option value={COMMON_TOKENS.ETH}>ETH</option>
        </select>
        <input
          type="text"
          value={toToken}
          onChange={(e) => setToToken(e.target.value)}
          placeholder="Or enter custom token address"
          className="border p-2 w-full text-xs"
        />
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (e.g., 0.1 for ETH, 100 for USDC)"
        className="border p-2 w-full mb-4"
        step="any"
      />

      <button
        onClick={handleQuote}
        className="px-4 py-2 bg-yellow-600 text-white rounded mr-2 hover:bg-yellow-700"
        disabled={!fromToken || !toToken || !amount}
      >
        Get Quote
      </button>
      <button
        onClick={handleSwap}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        disabled={!quote}
      >
        Swap
      </button>

      {quote && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Quote Details:</h3>
          <p className="text-sm">
            <strong>You'll receive:</strong> {formatTokenAmount(quote.destAmount, 18)} tokens
          </p>
          <p className="text-sm">
            <strong>Price Impact:</strong> {quote.side}
          </p>
          <p className="text-sm">
            <strong>Best Route:</strong>{" "}
            {quote.bestRoute?.[0]?.swaps?.[0]?.swapExchanges?.[0]?.exchange || "N/A"}
          </p>
          {quote.gasCost && (
            <p className="text-sm">
              <strong>Estimated Gas:</strong> {quote.gasCost}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SwapForm;