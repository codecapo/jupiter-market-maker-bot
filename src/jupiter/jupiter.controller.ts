import {BadRequestException, Body, Controller, HttpException, HttpStatus, Post} from '@nestjs/common';
import {JupiterService} from './jupiter.service';
import {SwapRequestDto} from './dto/swap.dto';

@Controller('jupiter')
export class JupiterController {
    constructor(private readonly jupiterService: JupiterService) {
    }


    @Post('parallel-swap')
    async parallelSwap(@Body() swapRequest: SwapRequestDto[]) {
        try {

            return await this.jupiterService.executeParallelSwaps(swapRequest)

        } catch (e) {
            throw new BadRequestException({
                message: 'Could not execute request, check values n request body',
                status: 400
            });
        }
    }

    @Post('swap')
    async swap(@Body() swapRequest: SwapRequestDto) {
        try {
            // Convert SOL to lamports (1 SOL = 1e9 lamports)
            const lamports = Math.round(swapRequest.amount * 1e9).toString();

            // Extract options for the swap
            const {
                inputMint,
                outputMint,
                privateKey,
                amount: _amount,  // exclude amount as we use lamports
                ...options
            } = swapRequest;

            return await this.jupiterService.executeSwap(
                inputMint,
                outputMint,
                lamports,
                privateKey,
                options
            );
        } catch (error) {
            throw new HttpException(
                {
                    status: HttpStatus.BAD_REQUEST,
                    error: error.message,
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    @Post('quote')
    async getQuote(@Body() swapRequest: SwapRequestDto) {
        try {
            const lamports = Math.round(swapRequest.amount * 1e9).toString();

            const quote = await this.jupiterService.getQuote(
                swapRequest.inputMint,
                swapRequest.outputMint,
                lamports,
                swapRequest.slippageBps
            );
            return quote;
        } catch (error) {
            throw new HttpException(
                {
                    status: HttpStatus.BAD_REQUEST,
                    error: error.message,
                },
                HttpStatus.BAD_REQUEST,
            );
        }
    }
}