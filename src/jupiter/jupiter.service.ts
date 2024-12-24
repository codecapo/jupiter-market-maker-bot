import { Injectable, Logger } from '@nestjs/common';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import * as bs58 from 'bs58';
import fetch from 'cross-fetch';
import { QuoteResponse, SwapRequestBody } from './interfaces/jupiter.interface';
import { SwapRequestDto } from './dto/swap.dto';

@Injectable()
export class JupiterService {
  private readonly logger = new Logger(JupiterService.name);
  private readonly connection: Connection;

  constructor() {
    // Use environment variables in production
    this.connection = new Connection(process.env.MAIN_RPC_URL, 'confirmed');
  }

  public async getQuote(
    inputMint: string,
    outputMint: string,
    amount: string,
    slippageBps: number = 50,
  ) {
    try {
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`,
      );

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.text();
        this.logger.error(`Quote API error: ${errorData}`);
        throw new Error(`Quote API error: ${errorData}`);
      }

      const quoteData = await quoteResponse.json();
      return quoteData;
    } catch (error) {
      this.logger.error(`Failed to get quote: ${error.message}`);
      throw error;
    }
  }

  public async getSwapTransaction(
    quoteResponse: QuoteResponse,
    userPublicKey: string,
    options: Partial<SwapRequestBody> = {},
  ) {
    try {
      const swapRequestBody: SwapRequestBody = {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        useSharedAccounts: false,
        // Only include computeUnitPriceMicroLamports if prioritizationFeeLamports is not set
        ...(options.prioritizationFeeLamports
          ? { prioritizationFeeLamports: options.prioritizationFeeLamports }
          : {
              computeUnitPriceMicroLamports:
                options.computeUnitPriceMicroLamports ?? 0,
            }),
        asLegacyTransaction: options.asLegacyTransaction ?? false,
        useTokenLedger: options.useTokenLedger ?? false,
        dynamicComputeUnitLimit: options.dynamicComputeUnitLimit ?? true,
        skipUserAccountsRpcCalls: options.skipUserAccountsRpcCalls ?? true,
        ...(options.feeAccount && { feeAccount: options.feeAccount }),
        ...(options.trackingAccount && {
          trackingAccount: options.trackingAccount,
        }),
        ...(options.destinationTokenAccount && {
          destinationTokenAccount: options.destinationTokenAccount,
        }),
        ...(options.dynamicSlippage && {
          dynamicSlippage: options.dynamicSlippage,
        }),
      };

      const transactionResponse = await fetch(
        'https://quote-api.jup.ag/v6/swap',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(swapRequestBody),
        },
      );

      if (!transactionResponse.ok) {
        const errorData = await transactionResponse.text();
        this.logger.error(`Swap API error: ${errorData}`);
        throw new Error(`Swap API error: ${errorData}`);
      }

      const transactionData = await transactionResponse.json();

      if (!transactionData.swapTransaction) {
        this.logger.error(
          'Swap transaction is undefined in response',
          transactionData,
        );
        throw new Error('Failed to get swap transaction from API');
      }

      return transactionData;
    } catch (error) {
      this.logger.error(`Failed to get swap transaction: ${error.message}`);
      throw error;
    }
  }

  public async executeSwap(
    inputMint: string,
    outputMint: string,
    amount: string,
    privateKeyString: string,
    options: Partial<SwapRequestBody> = {},
  ) {
    try {
      const params = {
        inputMint: inputMint,
        outputMint: outputMint,
        amount: amount,
        privateKeyString: privateKeyString,
        options: options,
      };

      this.logger.debug(
        `Starting swap execution with following params ${JSON.stringify(params, null, 2)}`,
      );

      // Create wallet from private key
      const privateKey = bs58.decode(privateKeyString);
      const keypair = Keypair.fromSecretKey(privateKey);
      const wallet = new Wallet(keypair);

      this.logger.debug(
        `Using wallet public key: ${wallet.publicKey.toString()}`,
      );

      // Get quote
      const quoteResponse = await this.getQuote(
        inputMint,
        outputMint,
        amount,
        options.quoteResponse?.slippageBps ?? 50,
      );
      // Get swap transaction
      const swapTransactionData = await this.getSwapTransaction(
        quoteResponse,
        wallet.publicKey.toString(),
        options,
      );

      this.logger.debug('Swap transaction data received');

      if (!swapTransactionData || !swapTransactionData.swapTransaction) {
        throw new Error('Invalid swap transaction data received');
      }

      // Deserialize and sign transaction
      const swapTransactionBuf = Buffer.from(
        swapTransactionData.swapTransaction,
        'base64',
      );
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      transaction.sign([keypair]);

      const latestBlockHash = await this.connection.getLatestBlockhash();

      // Send transaction
      const rawTransaction = transaction.serialize();
      const txid = await this.connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      this.logger.debug(`Transaction sent with ID: ${txid}`);

      const confirmation = await this.connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid,
      });

      this.logger.log(`https://solscan.io/tx/${txid}`);

      const swap = {
        success: true,
        txid,
        confirmation,
        quoteResponse,
      };

      this.logger.log(JSON.stringify(swap, null, 2));

      return {
        success: true,
        txid,
        confirmation,
        quoteResponse,
      };
    } catch (error) {
      this.logger.error(`Swap failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  // public async executeParallelSwaps(swapRequests: SwapRequestDto[]) {
  //     try {
  //         const swapPromises = swapRequests.map(swapRequest => {
  //             const lamports = Math.round(swapRequest.amount * 1e9).toString();
  //             return this.executeSwap(
  //                 swapRequest.inputMint,
  //                 swapRequest.outputMint,
  //                 lamports,
  //                 swapRequest.privateKey,
  //                 {computeUnitPriceMicroLamports: swapRequest.computeUnitPriceMicroLamports}
  //             );
  //         });
  //
  //         await Promise.all(swapPromises);
  //     } catch (e) {
  //         this.logger.error(`Swap failed: ${e}`);
  //     }
  //
  //
  // }

  public async executeParallelSwaps(swapRequests: SwapRequestDto[]) {
    const results: { success: boolean; error?: any }[] = [];

    for (const swapRequest of swapRequests) {
      try {
        const lamports = Math.round(swapRequest.amount * 1e9).toString();

        await this.executeSwap(
          swapRequest.inputMint,
          swapRequest.outputMint,
          lamports,
          swapRequest.privateKey,
          {
            computeUnitPriceMicroLamports:
              swapRequest.computeUnitPriceMicroLamports,
            dynamicSlippage: {
              minBps: 50, // 0.5%
              maxBps: 2000, // 20%
            },
          },
        );

        results.push({ success: true });
        this.logger.log(
          `Swap completed successfully for input mint: ${swapRequest.inputMint}`,
        );
      } catch (error) {
        results.push({ success: false, error });
        this.logger.error(
          `Swap failed for input mint ${swapRequest.inputMint}: ${error}`,
        );
      }
    }
    return results;
  }
}
