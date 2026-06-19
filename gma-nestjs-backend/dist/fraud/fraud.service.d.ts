import { PrismaService } from '../prisma/prisma.service';
export declare class FraudService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkDuplicateDocument(userId: string, publicId: string): Promise<boolean>;
    checkIpRateLimit(ipAddress: string): Promise<boolean>;
    logDeviceFingerprint(userId: string, fingerprint: string): Promise<void>;
}
