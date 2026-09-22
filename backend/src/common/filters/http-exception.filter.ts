import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        errors = (res as any).errors || null;
      }
    } else {
      this.logger.error(`Unhandled Exception: ${exception}`, (exception as any)?.stack);
    }

    response.status(status).json({
      thanhCong: false,
      maTrangThai: status,
      thongDiep: Array.isArray(message) ? message[0] : message,
      chiTietLoi: Array.isArray(message) ? message : errors,
      thoiDiem: new Date().toISOString(),
      duongDan: request.url,
    });
  }
}
