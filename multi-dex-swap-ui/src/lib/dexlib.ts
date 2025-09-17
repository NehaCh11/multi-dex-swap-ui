import { constructSimpleSDK, SwapSide } from "@paraswap/sdk";
import axios from "axios";
import { ethers } from "ethers";

const NETWORK = 1; // Ethereum Mainnet
const paraSwap = constructSimpleSDK({ chainId: NETWORK, axios });

// Well-known token addresses that should work with ParaSwap
export const VERIFIED_TOKENS = {
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeEeeeEeee",
  WETH: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // Wrapped Ether
  USDC: "0xa0b86a33e6417be50d7ce7e6c96b6e3c03b58c7d", // USD Coin (Native)
  USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7", // Tether USD
  DAI: "0x6b175474e89094c44da98b954eedeac495271d0f",   // Dai Stablecoin
  WBTC: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // Wrapped Bitcoin
};

// Type definitions for better type safety
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  [key: string]: unknown; // Allow other properties
}

interface TokensResponse {
  tokens: TokenInfo[];
}

/**
 * Get list of supported tokens from ParaSwap
 */
export async function getSupportedTokens(): Promise<TokenInfo[] | null> {
  try {
    // ParaSwap API endpoint for tokens
    const response = await axios.get<TokensResponse>(`https://apiv5.paraswap.io/tokens/${NETWORK}`);
    return response.data.tokens;
  } catch (error) {
    console.error("Error fetching supported tokens:", error);
    return null;
  }
}

/**
 * Validate if a token address is supported by ParaSwap
 */
export async function isTokenSupported(tokenAddress: string): Promise<boolean> {
  try {
    const tokens = await getSupportedTokens();
    if (!tokens) return false;
    
    // Check if token exists in the list (case-insensitive)
    return tokens.some((token: TokenInfo) => 
      token.address.toLowerCase() === tokenAddress.toLowerCase()
    );
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

/**
 * Get a price quote from ParaSwap
 */
export async function getQuote(
  srcToken: string,
  destToken: string,
  amount: string,
  userAddress: string
) {
  try {
    // Validate inputs
    if (!srcToken || !destToken || !amount || !userAddress) {
      throw new Error("All parameters are required");
    }

    // Normalize addresses to lowercase
    const normalizedSrcToken = srcToken.toLowerCase();
    const normalizedDestToken = destToken.toLowerCase();

    // Validate token addresses format
    const isValidAddress = (addr: string) => {
      return addr.match(/^0x[a-fA-F0-9]{40}$/) || addr === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    };

    if (!isValidAddress(normalizedSrcToken)) {
      throw new Error(`Invalid source token address format: ${srcToken}`);
    }
    
    if (!isValidAddress(normalizedDestToken)) {
      throw new Error(`Invalid destination token address format: ${destToken}`);
    }

    console.log("Calling ParaSwap API with:", { 
      srcToken: normalizedSrcToken, 
      destToken: normalizedDestToken, 
      amount, 
      userAddress 
    });

    const priceRoute = await paraSwap.swap.getRate({
      srcToken: normalizedSrcToken,
      destToken: normalizedDestToken,
      amount,
      userAddress,
      side: SwapSide.SELL,
    });

    if (priceRoute && typeof priceRoute === 'object' && 'error' in priceRoute) {
      throw new Error(`Quote API error: ${priceRoute.error}`);
    }

    return priceRoute;
  } catch (error) {
    console.error("getQuote error:", error);
    throw error;
  }
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
  try {
    // Normalize addresses to lowercase
    const normalizedSrcToken = srcToken.toLowerCase();
    const normalizedDestToken = destToken.toLowerCase();

    // Get a priceRoute first, then pass it to buildTx
    const priceRoute = await paraSwap.swap.getRate({
      srcToken: normalizedSrcToken,
      destToken: normalizedDestToken,
      amount,
      userAddress,
      side: SwapSide.SELL,
    });
    
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
    
    const txData = await paraSwap.swap.buildTx({
      srcToken: normalizedSrcToken,
      destToken: normalizedDestToken,
      srcAmount: amount,
      destAmount: priceRoute.destAmount,
      priceRoute,
      userAddress,
    });

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
  } catch (error) {
    console.error("executeSwap error:", error);
    throw error;
  }
}