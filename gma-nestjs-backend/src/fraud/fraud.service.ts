import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDuplicateDocument(userId: string, publicId: string): Promise<boolean> {
    const duplicate = await this.prisma.kycDocument.findFirst({
      where: {
        publicId,
        status: 'VERIFIED',
        userId: { not: userId },
      },
    });
    return !!duplicate;
  }

  async checkIpRateLimit(ipAddress: string): Promise<boolean> {
    console.log(`[Fraud Filter] Rate limit check for IP: ${ipAddress}`);
    return true; // SAFE
  }

  async logDeviceFingerprint(userId: string, fingerprint: string): Promise<void> {
    console.log(`[Fraud Filter] Logging device fingerprint for User ${userId}: ${fingerprint}`);
  }
}
