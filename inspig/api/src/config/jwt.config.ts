import { registerAs } from '@nestjs/config';

/**
 * JWT 설정
 */
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'inspig-secret-key-2024',
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
}));
