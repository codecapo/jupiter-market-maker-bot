import { IsString, IsNumber, IsOptional, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class DynamicSlippageDto {
    @IsNumber()
    @Min(0)
    minBps: number;

    @IsNumber()
    @Min(0)
    maxBps: number;
}

export class SwapRequestDto {
    @IsString()
    inputMint: string;

    @IsString()
    outputMint: string;

    @IsNumber()
    @Min(0)
    amount: number;  // In SOL (e.g., 0.1 for 0.1 SOL)

    @IsString()
    privateKey: string;

    @IsString()
    @IsOptional()
    feeAccount?: string;

    @IsString()
    @IsOptional()
    trackingAccount?: string;

    // Note: Only one of computeUnitPriceMicroLamports or prioritizationFeeLamports should be set
    @IsNumber()
    @IsOptional()
    @Min(0)
    computeUnitPriceMicroLamports?: number;

    @IsNumber()
    @IsOptional()
    @Min(0)
    prioritizationFeeLamports?: number;

    @IsBoolean()
    @IsOptional()
    asLegacyTransaction?: boolean;

    @IsBoolean()
    @IsOptional()
    useTokenLedger?: boolean;

    @IsString()
    @IsOptional()
    destinationTokenAccount?: string;

    @IsBoolean()
    @IsOptional()
    dynamicComputeUnitLimit?: boolean;

    @IsBoolean()
    @IsOptional()
    skipUserAccountsRpcCalls?: boolean;

    @ValidateNested()
    @Type(() => DynamicSlippageDto)
    @IsOptional()
    dynamicSlippage?: DynamicSlippageDto;

    @IsNumber()
    @IsOptional()
    @Min(0)
    @Max(100)
    slippageBps?: number;
}