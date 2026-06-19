import { Module } from '@nestjs/common';
import { KycEngineService } from './kyc-engine.service';
import { DocumentModule } from '../document/document.module';
import { FraudModule } from '../fraud/fraud.module';
import { WalletActivationModule } from '../wallet-activation/wallet-activation.module';

@Module({
  imports: [DocumentModule, FraudModule, WalletActivationModule],
  providers: [KycEngineService],
  exports: [KycEngineService],
})
export class KycModule {}
