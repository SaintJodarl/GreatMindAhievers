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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FraudService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FraudService = class FraudService {
    constructor(prisma) {
        this.prisma = prisma;
        this.ipRateLimitMap = new Map();
    }
    async checkDuplicateDocument(userId, publicId) {
        const duplicate = await this.prisma.kycDocument.findFirst({
            where: {
                publicId,
                status: 'VERIFIED',
                userId: { not: userId },
            },
        });
        return !!duplicate;
    }
    async checkIpRateLimit(ipAddress) {
        const now = Date.now();
        const limitRecord = this.ipRateLimitMap.get(ipAddress);
        if (!limitRecord) {
            this.ipRateLimitMap.set(ipAddress, { count: 1, lastRequest: now });
            return true;
        }
        if (now - limitRecord.lastRequest > 60 * 1000) {
            this.ipRateLimitMap.set(ipAddress, { count: 1, lastRequest: now });
            return true;
        }
        if (limitRecord.count >= 10) {
            console.warn(`[Fraud Detection] IP ${ipAddress} rate limited.`);
            return false;
        }
        limitRecord.count += 1;
        limitRecord.lastRequest = now;
        return true;
    }
    async logDeviceFingerprint(userId, fingerprint) {
        console.log(`[Fraud Detection] Logged device fingerprint for User ${userId}: ${fingerprint}`);
    }
};
exports.FraudService = FraudService;
exports.FraudService = FraudService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FraudService);
//# sourceMappingURL=fraud-detection.service.js.map