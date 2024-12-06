import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { AppService } from "./app.service";
import { CreateExecutionOrderDTO } from "./domain/dto/create-execution-order.dto";

@Injectable()
export class AppSchedulerService {
  private readonly logger = new Logger(AppSchedulerService.name);
  private createOrderJob: CronJob;
  private swapProcessorJob: CronJob;

  constructor(
      private readonly eventEmitter: EventEmitter2,
      private appService: AppService,
      private schedulerRegistry: SchedulerRegistry
  ) {}

  public async startJobs() {
    this.createOrderJob = new CronJob('*/15 * * * * *', async () => {
      await this.createExecutionOrderProcessor();
    });

    this.swapProcessorJob = new CronJob('*/15 * * * * *', async () => {
      await this.parallelSwapProcessor();
    });

    this.schedulerRegistry.addCronJob('createExecutionOrderProcessor', this.createOrderJob);
    this.schedulerRegistry.addCronJob('parallelSwapProcessor', this.swapProcessorJob);

    this.createOrderJob.start();
    this.swapProcessorJob.start();
    this.logger.log('Cron jobs started');
  }

  public restartJobs() {
    this.createOrderJob.start()
    this.swapProcessorJob.start()
  }

  public stopJobs() {
    this.createOrderJob?.stop();
    this.swapProcessorJob?.stop();
    this.logger.log('Cron jobs stopped');
  }

  public listJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    const names = []
    jobs.forEach((value, key, map) => {
      let next;
      try {
        next = value.nextDate().toJSDate();
        names.push(next);
      } catch (e) {
        next = 'error: next fire date is in the past!';
      }
      this.logger.log(`job: ${key} -> next: ${next}`);
    });
    return names;
  }

  async createExecutionOrderProcessor() {
    this.logger.log('createExecutionOrderProcessor');
    const randomWalletBatch = await this.appService.getRandomWalletBatch(1);
    const executionOrderDto: CreateExecutionOrderDTO = {
      marketMakerWallets: randomWalletBatch,
    };
    await this.appService.createExecutionOrder(executionOrderDto);
  }

  async parallelSwapProcessor() {
    this.logger.log('parallelSwapProcessor');
    await this.eventEmitter.emitAsync('execute.swaps');
  }
}