import { ParaSwap } from "@paraswap/sdk";
import { SwapSide } from "@paraswap/core";
import { ethers } from "ethers";

const NETWORK = 1; // Ethereum Mainnet as number for ParaSwap SDK

/**
 * Get a price quote from ParaSwap
 */
export async function getQuote(
  srcToken: string,
  destToken: string,
  amount: string,
  userAddress: string
) {
  const paraSwap = new ParaSwap({ chainId: NETWORK });

  // Only pass valid RateOptions (slippage may not be supported)
  const priceRoute = await paraSwap.getRate(
    srcToken,
    destToken,
    amount,
    userAddress,
    SwapSide.SELL
  );

  // ParaSwap sometimes returns { error: string }
  if (priceRoute && typeof priceRoute === 'object' && 'error' in priceRoute) {
    throw new Error(`Quote API error: ${priceRoute.error}`);
  }

  return priceRoute;
}

/**
 * Build and send a swap transaction via ParaSwap
 */
export async function executeSwap(
  srcToken: string,
  destToken: string,
  amount: string,
  userAddress: string,
  signer: ethers.Signer
): Promise<string> {
  const paraSwap = new ParaSwap({ chainId: NETWORK });

  // Only pass valid options
  // You need to get a priceRoute first, then pass it to buildTx
  const priceRoute = await paraSwap.getRate(
    srcToken,
    destToken,
    amount,
    userAddress,
    SwapSide.SELL
  );
  if (priceRoute && typeof priceRoute === 'object' && 'error' in priceRoute) {
    throw new Error(`Quote API error: ${priceRoute.error}`);
  }
  if (!priceRoute || typeof priceRoute !== 'object' || 'error' in priceRoute) {
    throw new Error('Invalid priceRoute for buildTx');
  }
  // Defensive: Only access destAmount if priceRoute is OptimalRate
  if (!('destAmount' in priceRoute)) {
    throw new Error('Invalid priceRoute: missing destAmount');
  }
  const txData = await paraSwap.buildTx(
    srcToken,
    destToken,
    amount,
    priceRoute.destAmount,
    priceRoute,
    userAddress
  );

  if (txData && typeof txData === 'object' && 'error' in txData) {
    throw new Error(`BuildTx API error: ${txData.error}`);
  }

  // Defensive: Only access properties if txData is TransactionParams
  if (!txData || typeof txData !== 'object' || !('to' in txData)) {
    throw new Error('Invalid transaction data');
  }

  const tx = await signer.sendTransaction({
    to: txData.to,
    data: txData.data,
    value: 'value' in txData && txData.value ? BigInt(txData.value) : undefined,
    gasPrice: 'gasPrice' in txData && txData.gasPrice ? BigInt(txData.gasPrice) : undefined,
    gasLimit: 'gas' in txData && txData.gas ? BigInt(txData.gas) : undefined,
  });

  return tx.hash;
}
