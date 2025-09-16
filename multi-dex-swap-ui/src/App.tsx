import React from "react";
import SwapForm from "./components/SwapForm";
import WalletButton from "./components/WalletButton";

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Multi-DEX Swap Demo</h1>
      <WalletButton />
      <SwapForm />
    </div>
  );
};

export default App;
