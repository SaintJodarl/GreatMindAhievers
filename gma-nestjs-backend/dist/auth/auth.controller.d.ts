import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(email: string, name?: string, sponsorId?: string): Promise<{
        message: string;
        userId: string;
        email: string;
        status: string;
    }>;
}
