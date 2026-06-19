"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessorModule = void 0;
const common_1 = require("@nestjs/common");
const background_processor_service_1 = require("./background-processor.service");
const kyc_module_1 = require("../kyc/kyc.module");
let ProcessorModule = class ProcessorModule {
};
exports.ProcessorModule = ProcessorModule;
exports.ProcessorModule = ProcessorModule = __decorate([
    (0, common_1.Module)({
        imports: [kyc_module_1.KycModule],
        providers: [background_processor_service_1.BackgroundProcessorService],
        exports: [background_processor_service_1.BackgroundProcessorService],
    })
], ProcessorModule);
//# sourceMappingURL=processor.module.js.map