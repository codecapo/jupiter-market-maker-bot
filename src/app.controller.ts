import {BadRequestException, Body, Controller, Get, Post} from '@nestjs/common';
import { AppService } from './app.service';
import {AppSchedulerService} from "./app.scheduler.service";
import {AddMarketMakerWalletDto} from "./domain/dto/add-market-maker-wallet.dto";
import {NewRandomSwapAmountRequestDto} from "./domain/dto/new-random-swap-amount-request.dto";

@Controller()
export class AppController {
  constructor(
      private readonly appService: AppService,
      private readonly appSchedulerService: AppSchedulerService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/wallet/insert-many')
  async insertManyMarketMakerWallets(
      @Body() marketMakerWallets: AddMarketMakerWalletDto[],
  ) {
    return this.appService.addMarketMakerWallets(marketMakerWallets);
  }

  @Post('swap-amounts/insert')
  async insertRandomSwapAmounts(@Body() randomSwapAmount: NewRandomSwapAmountRequestDto[]) {
    return await this.appService.deleteCurrentInsertNewRandomSwapAmount(randomSwapAmount)
  }

  @Post('cron/start')
  async startCronJobs(){
    try {
      await this.appSchedulerService.startJobs()
      return {'message': 'cronjob started'};
    } catch (e) {
      throw new BadRequestException({message: 'Could not start cronjob', status: 400});
    }
  }

  @Post('cron/restart')
  async restartCronJobs(){
    try {
      this.appSchedulerService.restartJobs()
      return {'message': 'cronjob started'};
    } catch (e) {
      throw new BadRequestException({message: 'Could not start cronjob', status: 400});
    }
  }

  @Post('cron/stop')
  async stopCronJobs(){
    try {
      this.appSchedulerService.stopJobs()
      return {'message': 'cronjob stopped'};
    } catch (e) {
      throw new BadRequestException({message: 'Could not stop cronjob', status: 400});
    }
  }

  @Get('cron/list')
  async listCronJobs(){
    try {
     const jobs =  this.appSchedulerService.listJobs()
      return {'message': `Current cronjobs${JSON.stringify(jobs)}`};

    } catch (e) {
      throw new BadRequestException({message: 'Could not stop cronjob', status: 400});
    }
  }
}
