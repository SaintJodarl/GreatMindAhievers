"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BackgroundProcessorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackgroundProcessorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const kyc_engine_service_1 = require("../kyc/kyc-engine.service");
let BackgroundProcessorService = BackgroundProcessorService_1 = class BackgroundProcessorService {
    constructor(prisma, kycEngineService) {
        this.prisma = prisma;
        this.kycEngineService = kycEngineService;
        this.logger = new common_1.Logger(BackgroundProcessorService_1.name);
        this.processingIds = new Set();
    }
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
        }
        catch (error) {
            this.logger.error(`Error scanning pending documents: ${error.message}`);
        }
    }
    scheduleImmediateProcess(documentId) {
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
};
exports.BackgroundProcessorService = BackgroundProcessorService;
exports.BackgroundProcessorService = BackgroundProcessorService = BackgroundProcessorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        kyc_engine_service_1.KycEngineService])
], BackgroundProcessorService);
//# sourceMappingURL=background-processor.service.js.map