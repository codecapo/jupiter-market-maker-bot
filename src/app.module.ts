import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JupiterModule } from './jupiter/jupiter.module';
import {ConfigModule} from "@nestjs/config";
import {AppRepo} from "./app.repo";
import {AppEventHandlerService} from "./app.event-handler.service";
import {AppSchedulerService} from "./app.scheduler.service";
import {ScheduleModule} from "@nestjs/schedule";
import {MongooseModule} from "@nestjs/mongoose";
import {Wallet, WalletSchema} from "./domain/schema/wallet.schema";
import {ExecutionOrder, ExecutionOrderSchema} from "./domain/schema/execution-order.schema";
import {EventEmitterModule} from "@nestjs/event-emitter";

@Module({

  imports: [JupiterModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.DB_CONNECTION_STRING),
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: ExecutionOrder.name, schema: ExecutionOrderSchema },
    ]),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppRepo, AppEventHandlerService, AppSchedulerService],
})
export class AppModule {}
