import React, { useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: import("ethers").Eip1193Provider;
  }
}

const WalletButton: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAddress(accounts[0]);
  };

  return (
    <button
      onClick={connectWallet}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      {address
        ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
        : "Connect Wallet"}
    </button>
  );
};

export default WalletButton;
