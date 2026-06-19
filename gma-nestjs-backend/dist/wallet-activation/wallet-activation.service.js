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
var WalletActivationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletActivationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WalletActivationService = WalletActivationService_1 = class WalletActivationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(WalletActivationService_1.name);
    }
    async tryActivateWallet(userId) {
        this.logger.log(`Evaluating wallet activation rules for User: ${userId}`);
        const documents = await this.prisma.kycDocument.findMany({
            where: { userId },
        });
        const hasFrontVerified = documents.some((doc) => doc.type === 'KYC_FRONT' && doc.status === 'VERIFIED');
        const hasBackVerified = documents.some((doc) => doc.type === 'KYC_BACK' && doc.status === 'VERIFIED');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            this.logger.warn(`User ${userId} not found for wallet activation.`);
            return false;
        }
        const isFraudSafe = user.status !== 'REGISTERED';
        if (hasFrontVerified && hasBackVerified && isFraudSafe) {
            this.logger.log(`All rules met. Activating wallet and user status for User: ${userId}`);
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.upsert({
                    where: { userId },
                    create: { userId, balance: 0 },
                    update: {},
                });
                await tx.user.update({
                    where: { id: userId },
                    data: { status: 'ACTIVE' },
                });
            });
            return true;
        }
        this.logger.warn(`Wallet activation failed for User ${userId}. Front: ${hasFrontVerified}, Back: ${hasBackVerified}, FraudSafe: ${isFraudSafe}`);
        return false;
    }
};
exports.WalletActivationService = WalletActivationService;
exports.WalletActivationService = WalletActivationService = WalletActivationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletActivationService);
//# sourceMappingURL=wallet-activation.service.js.map