import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

export interface ErrorResponseFormat {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

function isObjectRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (isObjectRecord(res)) {
        const msgProp = res.message;
        if (typeof msgProp === 'string') {
          message = msgProp;
        } else if (Array.isArray(msgProp)) {
          const stringItems: string[] = [];
          for (const item of msgProp) {
            if (typeof item === 'string') {
              stringItems.push(item);
            }
          }
          message = stringItems;
        } else {
          message = exception.message;
        }

        const errorProp = res.error;
        if (typeof errorProp === 'string') {
          error = errorProp;
        } else {
          error = exception.name;
        }
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = exception.issues.map((e) => {
        const path = e.path.join('.');
        return path ? `${path}: ${e.message}` : e.message;
      });
    } else if (exception instanceof Error) {
      if (exception.name === 'CastError') {
        status = HttpStatus.BAD_REQUEST;
        error = 'Bad Request';
        message = 'ID fornecido é inválido.';
      } else if (
        (exception as { code?: number }).code === 11000 ||
        exception.name === 'MongoServerError' ||
        exception.name === 'MongoError'
      ) {
        status = HttpStatus.CONFLICT;
        error = 'Conflict';
        message = 'Este e-mail já foi cadastrado.';
      } else {
        this.logger.error(
          `Exceção não tratada: ${exception.message}`,
          exception.stack,
        );
        message = exception.message || 'Erro interno do servidor';
      }
    } else {
      this.logger.error('Exceção desconhecida capturada:', String(exception));
    }

    const errorResponse: ErrorResponseFormat = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request?.url ?? '',
    };

    response.status(status).json(errorResponse);
  }
}
