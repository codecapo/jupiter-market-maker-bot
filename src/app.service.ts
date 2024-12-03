import {Injectable, Logger} from '@nestjs/common';
import * as base58 from 'bs58';
import {Keypair, PublicKey} from '@solana/web3.js';
import {AddMarketMakerWalletDto} from "./domain/dto/add-market-maker-wallet.dto";
import {CreateExecutionOrderDTO} from "./domain/dto/create-execution-order.dto";
import {ExecutionOrder} from "./domain/schema/execution-order.schema";
import {SwapRequestDto} from "./jupiter/dto/swap.dto";
import {AppRepo} from "./app.repo";
import {Wallet} from "./domain/schema/wallet.schema";
import {JupiterService} from "./jupiter/jupiter.service";

@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name);

    constructor(
        private readonly appRepo: AppRepo,
        private readonly jupiterService: JupiterService,
    ) {
    }

    getHello(): string {
        return 'Hello World!';
    }

    public async addMarketMakerWallets(
        addMarketMakerWallets: AddMarketMakerWalletDto[],
    ): Promise<any> {
        const marketMakerWallets: Wallet[] = addMarketMakerWallets.map((item) => {
            const wallet: Wallet = {
                incrementId: item.incrementId,
                privateKey: item.privateKey,
            };
            return wallet;
        });

        return await this.appRepo.addMarketMakerWallet(marketMakerWallets);
    }

    public async getRandomWalletBatch(batchSize: number): Promise<number[]> {
        const minMaxIncrementIds = await this.appRepo.getMinMaxIncrementIds();
        console.log('minMaxIncrementIds', minMaxIncrementIds);
        let randomRange = 0;
        const minValue = minMaxIncrementIds.minIncrement;
        const maxValue = minMaxIncrementIds.maxIncrement;
        const rangeSize = batchSize;
        const executionOrder = [];

        for (let i = 0; i < rangeSize; i++) {
            randomRange =
                Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue;
            executionOrder.push(randomRange);
        }

        return executionOrder;
    }

    public async createExecutionOrder(
        createExecutionOrderDTO: CreateExecutionOrderDTO,
    ) {
        const wallets = await Promise.all(
            createExecutionOrderDTO.marketMakerWallets.map(async (item) => {
                const getWallets = await this.appRepo.getWallet(item);

                const wallet: Wallet = {
                    incrementId: getWallets.incrementId,
                    privateKey: getWallets.privateKey,
                };

                return wallet;
            }),
        );

        console.log(wallets);

        const mapExecutionOrder: ExecutionOrder = {
            marketMakerWalletsToProcess: wallets,
        };

        return await this.appRepo.createExecutionOrder(mapExecutionOrder);
    }

    public async mapSwapRequests() {
        const marketMakerWallets = await this.appRepo.findStartOldestUnprocessedOrder();

        if (marketMakerWallets != null) {

            const randomAmount = Math.ceil((Math.random() * (0.1 - 0.001) + 0.001) * 1000) / 1000;

            const mappedExecutionOrderToSwapRequests =
                marketMakerWallets.marketMakerWalletsToProcess.map((item) => {
                    const swapRequests: SwapRequestDto = {
                        inputMint: "So11111111111111111111111111111111111111112",
                        outputMint: "8M4dUSPoacvBEBLSi3Dk3QA6Di2tiWt3RETAhfA2kQmp",
                        amount: randomAmount,
                        privateKey: item.privateKey,
                        computeUnitPriceMicroLamports: 100000  // Only set this
                    };
                    return swapRequests;
                });

            const serviceRequests = mappedExecutionOrderToSwapRequests.map(
                (request) => {
                    try {
                        if (!request.privateKey) {
                            throw new Error('User keypair is missing');
                        }

                        // Decode base58 secret key
                        const secretKey = base58.decode(request.privateKey);
                        const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey));

                        this.logger.debug(`Executing swap for public key: ${keypair.publicKey.toBase58()}`);

                        return {
                            inputMint: request.inputMint,
                            outputMint: request.outputMint,
                            amount: request.amount,
                            privateKey: request.privateKey,
                            computeUnitPriceMicroLamports: 100000  // Only set this
                        }
                    } catch (error) {
                        this.logger.error(
                            `Failed to process swap request: ${error.message}`,
                        );
                        throw error;
                    }
                },
            );

            return this.jupiterService.executeParallelSwaps(serviceRequests);
        }
    }
}
