import { Module } from '@nestjs/common';
import { BackgroundProcessorService } from './background-processor.service';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [KycModule],
  providers: [BackgroundProcessorService],
  exports: [BackgroundProcessorService],
})
export class ProcessorModule {}
