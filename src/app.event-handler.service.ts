import { OnEvent } from '@nestjs/event-emitter';
import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {AppService} from "./app.service";

@Injectable()
export class AppEventHandlerService {
  constructor(private readonly appService: AppService) {}


  @OnEvent('execute.swaps', { async: true })
  handleExecuteParallelSwapEvent() {
    this.appService.mapSwapRequests();
  }
}
