import React, { useState } from "react";
import { getQuote, executeSwap } from "../lib/dexlib";
import { ethers } from "ethers";
import type { OptimalRate } from "@paraswap/sdk";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}

const SwapForm: React.FC = () => {
  const [fromToken, setFromToken] = useState<string>("");
  const [toToken, setToToken] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [quote, setQuote] = useState<OptimalRate | null>(null);

  const handleQuote = async () => {
    try {
      if (!window.ethereum) {
        alert("Connect wallet first!");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
  const q = await getQuote(fromToken, toToken, amount, userAddress);
      if (q && typeof q === 'object' && !('error' in q)) {
        setQuote(q as OptimalRate);
      } else {
        setQuote(null);
      }
    } catch (err) {
      console.error("Quote error:", err);
      setQuote(null);
    }
  };

  const handleSwap = async () => {
    if (!window.ethereum) {
      alert("Connect wallet first!");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    try {
  const txHash = await executeSwap(fromToken, toToken, amount, userAddress, signer);
      alert(`Swap executed: ${txHash}`);
    } catch (err) {
      console.error("Swap error:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mt-6">
      <input
        type="text"
        value={fromToken}
        onChange={(e) => setFromToken(e.target.value)}
        placeholder="From Token Address"
        className="border p-2 w-full mb-2"
      />
      <input
        type="text"
        value={toToken}
        onChange={(e) => setToToken(e.target.value)}
        placeholder="To Token Address"
        className="border p-2 w-full mb-2"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        className="border p-2 w-full mb-2"
      />

      <button
        onClick={handleQuote}
        className="px-4 py-2 bg-yellow-600 text-white rounded mr-2"
      >
        Get Quote
      </button>
      <button
        onClick={handleSwap}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Swap
      </button>

      {quote && (
        <div className="mt-4 text-sm">
          <p>Best Price: {quote.destAmount}</p>
          <p>
            DEX:{" "}
            {quote.bestRoute?.[0]?.swaps?.[0]?.swapExchanges?.[0]?.exchange}
          </p>
        </div>
      )}
    </div>
  );
};

export default SwapForm;
