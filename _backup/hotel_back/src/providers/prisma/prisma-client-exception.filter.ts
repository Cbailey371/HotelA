import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpServer,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { PRISMA_API_ERROR } from '@constants/errors.constants';

export type ErrorCodesStatusMapping = {
  [key: string]: number;
};

/**
 * {@link PrismaClientExceptionFilter}
 * catches {@link Prisma.PrismaClientKnownRequestError}
 * and handles "not found" errors (P2025).
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  /**
   * default error codes mapping
   *
   * Error codes definition for Prisma Client (Query Engine)
   * @see https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
   */
  private errorCodesStatusMapping: ErrorCodesStatusMapping = {
    P2000: HttpStatus.BAD_REQUEST,
    P2002: HttpStatus.CONFLICT,
    P2003: HttpStatus.CONFLICT,
    P2025: HttpStatus.NOT_FOUND,
  };

  /**
   * @param applicationRef
   * @param errorCodesStatusMapping
   */
  constructor(
    applicationRef?: HttpServer,
    errorCodesStatusMapping?: ErrorCodesStatusMapping,
  ) {
    super(applicationRef);

    // use custom error codes mapping (overwrite)
    //
    // @example:
    //
    //   const { httpAdapter } = app.get(HttpAdapterHost);
    //   app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter, {
    //     P2022: HttpStatus.BAD_REQUEST,
    //   }));
    //
    if (errorCodesStatusMapping) {
      this.errorCodesStatusMapping = Object.assign(
        this.errorCodesStatusMapping,
        errorCodesStatusMapping,
      );
    }
  }

  /**
   * @param exception
   * @param host
   * @returns
   */
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    return this.catchClientKnownRequestError(exception, host);
  }

  private catchClientKnownRequestError(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const statusCode = this.errorCodesStatusMapping[exception.code] || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.exceptionShortMessage(exception.message);

    // Si es un error P2025 (RecordNotFound), tratarlo como un caso especial
    if (exception.code === 'P2025') {
      return this.handleNotFoundError(exception, host);
    }

    if (!Object.keys(this.errorCodesStatusMapping).includes(exception.code)) {
      return super.catch(exception, host);
    }

    const [code] = PRISMA_API_ERROR.split(':');

    super.catch(
      new HttpException(
        {
          success: false,
          error: {
            details: exception.code,
            message,
            code: parseInt(code, 10),
          },
        },
        statusCode,
      ),
      host,
    );
  }

  private handleNotFoundError(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ) {
    const statusCode = HttpStatus.NOT_FOUND;
    const message = exception.message;

    const [code] = PRISMA_API_ERROR.split(':');

    super.catch(
      new HttpException(
        {
          success: false,
          error: {
            details: 'P2025',
            message: this.extractNotFoundMessage(message),
            code: parseInt(code, 10),
          },
        },
        statusCode,
      ),
      host,
    );
  }

  private extractNotFoundMessage(message: string): string {
    // Intenta extraer el mensaje relevante del error P2025
    // El formato típico es "Record to ... not found" o similar
    try {
      // Intenta obtener el mensaje después de "where" o después de dos puntos
      if (message.includes('where:')) {
        return message.split('where:')[0].trim();
      } else if (message.includes(':')) {
        return message.split(':')[1].trim();
      }
      return message;
    } catch (error) {
      return message;
    }
  }

  private exceptionShortMessage(message: string): string {
    try {
      const shortMessage = message.substring(message.indexOf('→'));
      return shortMessage
        .substring(shortMessage.indexOf('\n'))
        .replace(/\n/g, '')
        .trim();
    } catch (error) {
      return message;
    }
  }
}