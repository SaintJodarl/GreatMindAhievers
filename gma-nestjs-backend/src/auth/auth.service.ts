import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async registerUser(email: string, name?: string, sponsorId?: string) {
    const lowercaseEmail = email.toLowerCase().trim();

    const exists = await this.prisma.user.findUnique({
      where: { email: lowercaseEmail },
    });
    if (exists) {
      throw new BadRequestException('User with this email already exists.');
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: lowercaseEmail,
          name,
          sponsorId,
          status: 'REGISTERED',
        },
      });

      let sponsorPath = '';
      let sponsorDepth = 0;

      if (sponsorId) {
        const sponsor = await tx.user.findUnique({
          where: { id: sponsorId },
          select: { path: true, depth: true },
        });
        if (sponsor) {
          sponsorPath = sponsor.path || `root/${sponsorId}`;
          sponsorDepth = sponsor.depth || 0;
        }
      }

      const userPath = sponsorId ? `${sponsorPath}/${user.id}` : `root/${user.id}`;
      const userDepth = sponsorId ? sponsorDepth + 1 : 0;

      if (sponsorPath && sponsorPath.split('/').includes(user.id)) {
        throw new BadRequestException('Circular referral sponsor loop detected.');
      }

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          path: userPath,
          depth: userDepth,
        },
      });

      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
        },
      });

      return updatedUser;
    });
  }
}
