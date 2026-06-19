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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const document_service_1 = require("../document/document.service");
const background_processor_service_1 = require("../processor/background-processor.service");
const client_1 = require("@prisma/client");
let UploadController = class UploadController {
    constructor(cloudinaryService, documentService, backgroundProcessor) {
        this.cloudinaryService = cloudinaryService;
        this.documentService = documentService;
        this.backgroundProcessor = backgroundProcessor;
        this.rateLimiter = new Map();
    }
    async uploadKycDocument(authUserId, idempotencyKey, type, file) {
        if (!authUserId) {
            throw new common_1.BadRequestException('User authentication is required (x-user-id header missing).');
        }
        if (!type || !Object.values(client_1.DocumentType).includes(type)) {
            throw new common_1.BadRequestException('Valid document type (KYC_FRONT, KYC_BACK, PROFILE) is required.');
        }
        const now = Date.now();
        const limitRecord = this.rateLimiter.get(authUserId);
        if (!limitRecord) {
            this.rateLimiter.set(authUserId, { count: 1, windowStart: now });
        }
        else {
            if (now - limitRecord.windowStart > 60 * 1000) {
                this.rateLimiter.set(authUserId, { count: 1, windowStart: now });
            }
            else {
                if (limitRecord.count >= 5) {
                    throw new common_1.BadRequestException('Upload rate limit exceeded. Max 5 uploads per minute.');
                }
                limitRecord.count += 1;
            }
        }
        if (idempotencyKey) {
            const existingDoc = await this.documentService.findUniqueByIdempotencyKey(idempotencyKey);
            if (existingDoc) {
                console.log(`[Idempotency Gate] Duplicate request detected for key ${idempotencyKey}. Returning cached record.`);
                return {
                    message: 'Duplicate request detected. Returning cached upload record.',
                    documentId: existingDoc.id,
                    secureUrl: existingDoc.fileUrl,
                    publicId: existingDoc.publicId,
                    status: existingDoc.status,
                };
            }
        }
        try {
            const uploadResult = await this.cloudinaryService.uploadFile(file, authUserId);
            const document = await this.documentService.createDocumentWithIdempotency(authUserId, type, uploadResult.secure_url, uploadResult.public_id, idempotencyKey || null);
            this.backgroundProcessor.scheduleImmediateProcess(document.id);
            return {
                message: 'File uploaded successfully. Verification processing.',
                documentId: document.id,
                secureUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                status: document.status,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Upload failed: ${error.message}`);
        }
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('kyc'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Headers)('x-user-id')),
    __param(1, (0, common_1.Headers)('x-idempotency-key')),
    __param(2, (0, common_1.Body)('type')),
    __param(3, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
            new common_1.FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadKycDocument", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [cloudinary_service_1.CloudinaryService,
        document_service_1.DocumentService,
        background_processor_service_1.BackgroundProcessorService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map