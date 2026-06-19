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
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentService = class DocumentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createDocument(userId, type, fileUrl, publicId) {
        return this.prisma.kycDocument.create({
            data: {
                userId,
                type,
                fileUrl,
                publicId,
                status: 'PENDING',
            },
        });
    }
    async findUniqueByIdempotencyKey(idempotencyKey) {
        return this.prisma.kycDocument.findUnique({
            where: { idempotencyKey },
        });
    }
    async createDocumentWithIdempotency(userId, type, fileUrl, publicId, idempotencyKey) {
        return this.prisma.kycDocument.create({
            data: {
                userId,
                type,
                fileUrl,
                publicId,
                idempotencyKey,
                status: 'PENDING',
            },
        });
    }
    async updateStatus(id, status) {
        return this.prisma.kycDocument.update({
            where: { id },
            data: { status },
        });
    }
    async incrementRetryCount(id) {
        return this.prisma.kycDocument.update({
            where: { id },
            data: { retryCount: { increment: 1 } },
        });
    }
    async findUserDocuments(userId) {
        return this.prisma.kycDocument.findMany({
            where: { userId },
        });
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentService);
//# sourceMappingURL=document.service.js.map