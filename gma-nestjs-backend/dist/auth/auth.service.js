"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registerUser(email, name, sponsorId) {
        const lowercaseEmail = email.toLowerCase().trim();
        const exists = await this.prisma.user.findUnique({
            where: { email: lowercaseEmail },
        });
        if (exists) {
            throw new common_1.BadRequestException('User with this email already exists.');
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
                throw new common_1.BadRequestException('Circular referral sponsor loop detected.');
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map