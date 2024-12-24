import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  ExecutionOrder,
  ExecutionOrderDocument,
} from './domain/schema/execution-order.schema';
import { Wallet, WalletDocument } from './domain/schema/wallet.schema';
import { MarketMakerWalletMinMaxIncrementIdsDo } from './domain/do/market-maker-wallet-min-max-increment-ids.do';
import {
  RandomSwapAmount,
  RandomSwapAmountDocument,
} from './domain/schema/random-swap-amount.schema';

@Injectable()
export class AppRepo {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(ExecutionOrder.name)
    private executionOrderModel: Model<ExecutionOrderDocument>,
    @InjectModel(RandomSwapAmount.name)
    private readonly randomSwapAmountModel: Model<RandomSwapAmountDocument>,
  ) {}

  public async addMarketMakerWallet(marketMakerWallets: Wallet[]) {
    return await this.walletModel.insertMany(marketMakerWallets);
  }

  public async getMinMaxIncrementIds(): Promise<MarketMakerWalletMinMaxIncrementIdsDo> {
    const aggregateQuery = [
      {
        $group: {
          _id: null,
          minIncrement: { $min: '$incrementId' },
          maxIncrement: { $max: '$incrementId' },
        },
      },
      {
        $project: {
          _id: 0,
          minIncrement: 1,
          maxIncrement: 1,
        },
      },
    ];

    const result = await this.walletModel.aggregate(aggregateQuery);
    return result[0];
  }

  public async createExecutionOrder(executionOrder: ExecutionOrder) {
    return await this.executionOrderModel.create(executionOrder);
  }

  public async findStartOldestUnprocessedOrder(): Promise<ExecutionOrderDocument> {
    try {
      const old = await this.executionOrderModel
        .findOne({
          startedAt: { $exists: false },
          finishedAt: { $exists: false },
        })
        .sort({ createdAt: 1 });

      if (old == null) {
        return;
      } else {
        return this.executionOrderModel.findByIdAndUpdate(
          { _id: old._id },
          {
            startedAt: new Date(),
          },
          { new: true },
        );
      }
    } catch (e) {
      throw e;
    }
  }

  public async getWallet(incrementId: number): Promise<WalletDocument> {
    return this.walletModel.findOne({ incrementId: incrementId });
  }

  public async deleteExistingAndInsertNewRandomSwapAmounts(
    randomSwapAmount: RandomSwapAmount[],
  ) {
    await this.randomSwapAmountModel.deleteMany({});
    return await this.randomSwapAmountModel.insertMany(randomSwapAmount);
  }

  public async getRandomSwapAmount(position: number) {
    return this.randomSwapAmountModel.findOne({
      incrementPositionKey: position,
    });
  }
}
