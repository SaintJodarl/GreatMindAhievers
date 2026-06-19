import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KycEngineService } from '../kyc/kyc-engine.service';
export declare class BackgroundProcessorService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly kycEngineService;
    private readonly logger;
    private intervalId;
    private readonly processingIds;
    constructor(prisma: PrismaService, kycEngineService: KycEngineService);
    onModuleInit(): void;
    scanAndProcessDocuments(): Promise<void>;
    scheduleImmediateProcess(documentId: string): void;
    onModuleDestroy(): void;
}
