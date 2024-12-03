import {BadRequestException, Controller, Get, Post} from '@nestjs/common';
import { AppService } from './app.service';
import {AppSchedulerService} from "./app.scheduler.service";

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
