import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletActivationService {
  private readonly logger = new Logger(WalletActivationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async tryActivateWallet(userId: string): Promise<boolean> {
    this.logger.log(`Evaluating wallet activation rules for User: ${userId}`);

    const documents = await this.prisma.kycDocument.findMany({
      where: { userId },
    });

    const hasFrontVerified = documents.some(
      (doc) => doc.type === 'KYC_FRONT' && doc.status === 'VERIFIED',
    );
    const hasBackVerified = documents.some(
      (doc) => doc.type === 'KYC_BACK' && doc.status === 'VERIFIED',
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for wallet activation.`);
      return false;
    }

    // Basic rule evaluation
    const isFraudSafe = user.status !== 'REGISTERED'; // Under registered, user is new, so once KYC starts state advances.

    if (hasFrontVerified && hasBackVerified && isFraudSafe) {
      this.logger.log(`All rules met. Activating wallet and user status for User: ${userId}`);

      await this.prisma.$transaction(async (tx) => {
        await tx.wallet.upsert({
          where: { userId },
          create: { userId, balance: 0 },
          update: {},
        });

        await tx.user.update({
          where: { id: userId },
          data: { status: 'ACTIVE' },
        });
      });

      return true;
    }

    this.logger.warn(
      `Wallet activation failed for User ${userId}. Front: ${hasFrontVerified}, Back: ${hasBackVerified}, FraudSafe: ${isFraudSafe}`,
    );
    return false;
  }
}
