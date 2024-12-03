import { Keypair } from '@solana/web3.js';

export interface SwapParams {
  userKeypair: Keypair;
  inputToken: string;
  outputToken: string;
  amount: number;
  slippage: number;
}
