import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorType, getErrorTypeByStatus } from '../err';

/**
 * HTTP 예외 필터
 * 모든 HTTP 예외를 표준 형식으로 응답
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;

    // 에러 유형 분류 (중앙화된 함수 사용)
    const errorType = getErrorTypeByStatus(status);

    this.logger.error(
      `[${errorType}] ${request.method} ${request.url} ${status} - ${errorMessage}`,
    );

    response.status(status).json({
      success: false,
      errorType,
      statusCode: status,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}

/**
 * 모든 예외 필터 (예기치 않은 에러 포함)
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : '서버 내부 오류가 발생했습니다.';

    // 에러 유형 (예상치 못한 에러는 DB 또는 BACKEND로 분류)
    const errorType = status >= 500 ? 'DB' : 'BACKEND';

    this.logger.error(
      `[${errorType}] ${request.method} ${request.url} ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      success: false,
      errorType, // 에러 유형 추가
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
