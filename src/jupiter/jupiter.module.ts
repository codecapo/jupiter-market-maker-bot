// src/jupiter/jupiter.module.ts
import { Module } from '@nestjs/common';
import { JupiterService } from './jupiter.service';
import { JupiterController } from './jupiter.controller';

@Module({
    providers: [JupiterService],
    controllers: [JupiterController],
    exports: [JupiterService],
})
export class JupiterModule {}