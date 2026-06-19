"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./prisma/prisma.module");
const cloudinary_module_1 = require("./cloudinary/cloudinary.module");
const document_module_1 = require("./document/document.module");
const fraud_module_1 = require("./fraud/fraud.module");
const wallet_activation_module_1 = require("./wallet-activation/wallet-activation.module");
const auth_module_1 = require("./auth/auth.module");
const processor_module_1 = require("./processor/processor.module");
const upload_module_1 = require("./upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            cloudinary_module_1.CloudinaryModule,
            document_module_1.DocumentModule,
            fraud_module_1.FraudModule,
            wallet_activation_module_1.WalletActivationModule,
            auth_module_1.AuthModule,
            processor_module_1.ProcessorModule,
            upload_module_1.UploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map