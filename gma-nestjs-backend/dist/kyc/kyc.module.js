"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycModule = void 0;
const common_1 = require("@nestjs/common");
const kyc_engine_service_1 = require("./kyc-engine.service");
const document_module_1 = require("../document/document.module");
const fraud_module_1 = require("../fraud/fraud.module");
const wallet_activation_module_1 = require("../wallet-activation/wallet-activation.module");
let KycModule = class KycModule {
};
exports.KycModule = KycModule;
exports.KycModule = KycModule = __decorate([
    (0, common_1.Module)({
        imports: [document_module_1.DocumentModule, fraud_module_1.FraudModule, wallet_activation_module_1.WalletActivationModule],
        providers: [kyc_engine_service_1.KycEngineService],
        exports: [kyc_engine_service_1.KycEngineService],
    })
], KycModule);
//# sourceMappingURL=kyc.module.js.map