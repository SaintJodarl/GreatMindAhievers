import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycEngineService } from '../kyc/kyc-engine.service';

@Injectable()
export class BackgroundProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackgroundProcessorService.name);
  private intervalId: NodeJS.Timeout;
  private readonly processingIds = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly kycEngineService: KycEngineService,
  ) {}

  onModuleInit() {
    this.intervalId = setInterval(() => this.scanAndProcessDocuments(), 5000);
    this.logger.log('Internal Async Polling Processor started (scanning every 5 seconds).');
  }

  async scanAndProcessDocuments() {
    try {
      const pendingDocs = await this.prisma.kycDocument.findMany({
        where: { status: 'PENDING' },
        select: { id: true },
        take: 10,
      });

      for (const doc of pendingDocs) {
        if (this.processingIds.has(doc.id)) {
          continue;
        }

        this.processingIds.add(doc.id);

        this.kycEngineService
          .processKycDocument(doc.id)
          .catch((err) => {
            this.logger.error(`Error in async process for doc ${doc.id}: ${err.message}`);
          })
          .finally(() => {
            this.processingIds.delete(doc.id);
          });
      }
    } catch (error) {
      this.logger.error(`Error scanning pending documents: ${error.message}`);
    }
  }

  scheduleImmediateProcess(documentId: string) {
    setTimeout(() => {
      if (!this.processingIds.has(documentId)) {
        this.processingIds.add(documentId);
        this.kycEngineService
          .processKycDocument(documentId)
          .catch((err) => {
            this.logger.error(`Error in immediate process for doc ${documentId}: ${err.message}`);
          })
          .finally(() => {
            this.processingIds.delete(documentId);
          });
      }
    }, 1000);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
