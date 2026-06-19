import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { DocumentModule } from './document/document.module';
import { FraudModule } from './fraud/fraud.module';
import { WalletActivationModule } from './wallet-activation/wallet-activation.module';
import { AuthModule } from './auth/auth.module';
import { ProcessorModule } from './processor/processor.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    DocumentModule,
    FraudModule,
    WalletActivationModule,
    AuthModule,
    ProcessorModule,
    UploadModule,
  ],
})
export class AppModule {}
