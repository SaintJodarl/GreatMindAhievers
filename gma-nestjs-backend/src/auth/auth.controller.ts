import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('name') name?: string,
    @Body('sponsorId') sponsorId?: string,
  ) {
    if (!email) {
      throw new BadRequestException('Email is required.');
    }
    const user = await this.authService.registerUser(email, name, sponsorId);
    return {
      message: 'User registered successfully.',
      userId: user.id,
      email: user.email,
      status: user.status,
    };
  }
}
