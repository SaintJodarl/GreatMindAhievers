import { PrismaService } from '../prisma/prisma.service';
export declare class WalletActivationService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    tryActivateWallet(userId: string): Promise<boolean>;
}
