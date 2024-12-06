import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {Connection, PublicKey} from "@solana/web3.js";
import {PhantomWalletAdapter} from "@solana/wallet-adapter-phantom";

describe('AppController', () => {

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({

    }).compile();
  });

  describe('root', () => {

  });

  it('POST / (POST)', () => {




  })
});
