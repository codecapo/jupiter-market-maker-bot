export interface SwapInfo {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
}

export interface RoutePlan {
    swapInfo: SwapInfo;
    percent: number;
}

export interface PlatformFee {
    amount: string;
    feeBps: number;
}

export interface QuoteResponse {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: 'ExactIn' | 'ExactOut';
    slippageBps: number;
    platformFee?: PlatformFee;
    priceImpactPct: string;
    routePlan: RoutePlan[];
    contextSlot: number;
    timeTaken: number;
}

export interface SwapRequestBody {
    userPublicKey: string;
    wrapAndUnwrapSol: boolean;
    useSharedAccounts: boolean;
    feeAccount?: string;
    trackingAccount?: string;
    computeUnitPriceMicroLamports?: number;
    prioritizationFeeLamports?: number;
    asLegacyTransaction: boolean;
    useTokenLedger: boolean;
    destinationTokenAccount?: string;
    dynamicComputeUnitLimit: boolean;
    skipUserAccountsRpcCalls: boolean;
    dynamicSlippage?: {
        minBps: number;
        maxBps: number;
    };
    quoteResponse: QuoteResponse;
}