import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ZodError, z } from 'zod';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    url: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/test-path',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('deve formatar HttpException corretamente', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
        error: 'HttpException',
        path: '/test-path',
      }),
    );
  });

  it('deve formatar ZodError corretamente como 400 Bad Request', () => {
    const schema = z.object({ name: z.string() });
    let zodError: ZodError | null = null;
    try {
      schema.parse({});
    } catch (err: unknown) {
      if (err instanceof ZodError) {
        zodError = err;
      }
    }

    filter.catch(zodError!, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        path: '/test-path',
      }),
    );
  });

  it('deve tratar exceção genérica (500)', () => {
    const exception = new Error('Erro inesperado');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Erro inesperado',
        error: 'Internal Server Error',
        path: '/test-path',
      }),
    );
  });

  it('deve tratar erro de duplicidade do MongoDB (code 11000) como 409 Conflict', () => {
    const exception = new Error('E11000 duplicate key error collection');
    (exception as unknown as Record<string, unknown>).code = 11000;

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Este e-mail já foi cadastrado.',
        error: 'Conflict',
        path: '/test-path',
      }),
    );
  });
});
