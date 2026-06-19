import { PrismaService } from '../prisma/prisma.service';
import { DocumentService } from '../document/document.service';
import { FraudService } from '../fraud/fraud-detection.service';
import { WalletActivationService } from '../wallet-activation/wallet-activation.service';
export declare class KycEngineService {
    private readonly prisma;
    private readonly documentService;
    private readonly fraudService;
    private readonly walletActivationService;
    private readonly logger;
    constructor(prisma: PrismaService, documentService: DocumentService, fraudService: FraudService, walletActivationService: WalletActivationService);
    processKycDocument(documentId: string): Promise<void>;
}
