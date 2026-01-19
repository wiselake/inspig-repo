import { registerAs } from '@nestjs/config';

/**
 * 데이터베이스 설정
 */
export default registerAs('database', () => ({
  type: 'oracle' as const,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1521', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  serviceName: process.env.DB_SERVICE_NAME,
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
}));
