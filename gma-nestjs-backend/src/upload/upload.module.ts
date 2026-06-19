import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { DocumentModule } from '../document/document.module';
import { ProcessorModule } from '../processor/processor.module';

@Module({
  imports: [CloudinaryModule, DocumentModule, ProcessorModule],
  controllers: [UploadController],
})
export class UploadModule {}
