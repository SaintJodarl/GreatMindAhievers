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
var KycEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycEngineService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const document_service_1 = require("../document/document.service");
const fraud_detection_service_1 = require("../fraud/fraud-detection.service");
const wallet_activation_service_1 = require("../wallet-activation/wallet-activation.service");
let KycEngineService = KycEngineService_1 = class KycEngineService {
    constructor(prisma, documentService, fraudService, walletActivationService) {
        this.prisma = prisma;
        this.documentService = documentService;
        this.fraudService = fraudService;
        this.walletActivationService = walletActivationService;
        this.logger = new common_1.Logger(KycEngineService_1.name);
    }
    async processKycDocument(documentId) {
        this.logger.log(`Starting async processing for KYC Document: ${documentId}`);
        const doc = await this.prisma.kycDocument.findUnique({
            where: { id: documentId },
        });
        if (!doc) {
            this.logger.error(`Document ${documentId} not found in database.`);
            return;
        }
        await this.prisma.user.update({
            where: { id: doc.userId },
            data: { status: 'KYC_IN_PROGRESS' },
        });
        try {
            const isDuplicate = await this.fraudService.checkDuplicateDocument(doc.userId, doc.publicId);
            if (isDuplicate) {
                this.logger.warn(`Fraud check failed: Duplicate KYC document detected for User ${doc.userId}`);
                await this.documentService.updateStatus(documentId, 'REJECTED');
                return;
            }
            if (!doc.fileUrl || !doc.fileUrl.startsWith('http')) {
                this.logger.warn(`Verification failed: Invalid Cloudinary URL.`);
                await this.documentService.updateStatus(documentId, 'REJECTED');
                return;
            }
            await this.documentService.updateStatus(documentId, 'VERIFIED');
            this.logger.log(`Document ${documentId} successfully verified.`);
            await this.walletActivationService.tryActivateWallet(doc.userId);
        }
        catch (error) {
            this.logger.error(`Error processing KYC document ${documentId}: ${error.message}`);
            await this.documentService.incrementRetryCount(documentId);
            await this.documentService.updateStatus(documentId, 'REJECTED');
        }
    }
};
exports.KycEngineService = KycEngineService;
exports.KycEngineService = KycEngineService = KycEngineService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        document_service_1.DocumentService,
        fraud_detection_service_1.FraudService,
        wallet_activation_service_1.WalletActivationService])
], KycEngineService);
//# sourceMappingURL=kyc-engine.service.js.map