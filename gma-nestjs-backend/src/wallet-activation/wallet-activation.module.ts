import { Module } from '@nestjs/common';
import { WalletActivationService } from './wallet-activation.service';

@Module({
  providers: [WalletActivationService],
  exports: [WalletActivationService],
})
export class WalletActivationModule {}
