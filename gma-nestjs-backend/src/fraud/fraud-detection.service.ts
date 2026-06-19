import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FraudService {
  // Simple in-memory IP rate limiter map
  private ipRateLimitMap = new Map<string, { count: number; lastRequest: number }>();

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
    const now = Date.now();
    const limitRecord = this.ipRateLimitMap.get(ipAddress);

    if (!limitRecord) {
      this.ipRateLimitMap.set(ipAddress, { count: 1, lastRequest: now });
      return true;
    }

    // Reset limit window after 1 minute (60 seconds)
    if (now - limitRecord.lastRequest > 60 * 1000) {
      this.ipRateLimitMap.set(ipAddress, { count: 1, lastRequest: now });
      return true;
    }

    if (limitRecord.count >= 10) {
      console.warn(`[Fraud Detection] IP ${ipAddress} rate limited.`);
      return false; // Rate limit exceeded!
    }

    limitRecord.count += 1;
    limitRecord.lastRequest = now;
    return true;
  }

  async logDeviceFingerprint(userId: string, fingerprint: string): Promise<void> {
    console.log(`[Fraud Detection] Logged device fingerprint for User ${userId}: ${fingerprint}`);
  }
}
