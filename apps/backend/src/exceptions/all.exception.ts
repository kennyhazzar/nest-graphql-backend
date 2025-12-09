import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseExceptionFilter } from '@nestjs/core';
import { Catch, ArgumentsHost, HttpException, HttpServer, HttpStatus, BadRequestException } from '@nestjs/common';
import { GqlContextType, GqlExceptionFilter } from '@nestjs/graphql';
import { PinoLogger } from 'nestjs-pino';
import { I18nContext } from 'nestjs-i18n';

import { I18nPath, I18nTranslations } from '@/i18n';
import { GraphQLContext } from '@/interfaces/graphql-context.interface';

@Catch()
export class AllExceptionFilter
  extends BaseExceptionFilter<HttpException>
  implements GqlExceptionFilter<HttpException>
{
  private readonly logger = new PinoLogger({ pinoHttp: { level: 'debug' } });

  constructor(applicationRef: HttpServer) {
    super(applicationRef);
  }

  /**
   * Handle I18nValidationException and translate validation errors
   */
  private handleI18nValidationException(exception: any, i18n: any): string[] | null {
    if (exception.name === 'I18nValidationException' && exception.errors) {
      const validationErrors = exception.errors;
      const messages: string[] = [];

      for (const error of validationErrors) {
        if (error.constraints) {
          for (const constraintKey of Object.keys(error.constraints)) {
            const constraintValue = error.constraints[constraintKey];
            // Format: 'validation.KEY|{"value":"...","constraints":[...]}'
            const [i18nKey, argsJson] = constraintValue.split('|');

            try {
              if (typeof i18n?.t === 'function') {
                let args = {};
                if (argsJson) {
                  try {
                    args = JSON.parse(argsJson);
                  } catch {
                    args = { value: error.value };
                  }
                }
                const translatedMsg = i18n.t(i18nKey, { args });
                messages.push(translatedMsg);
              } else {
                messages.push(constraintValue);
              }
            } catch {
              messages.push(constraintValue);
            }
          }
        }
      }

      return messages;
    }
    return null;
  }

  handleUnknownError(exception: HttpException | Error, host: ArgumentsHost): void {
    const name = exception?.name || 'HttpException';
    const message = exception?.message || `${name}: Internal server error`;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException && typeof exception.getStatus === 'function') {
      try {
        status = exception.getStatus();
      } catch {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    try {
      this.logger?.trace({
        msg: message,
        userId: request?.userId,
        roleId: request?.roleId,
        roleType: request?.roleType,
        language: request?.language,
        context: 'HTTP',
        statusCode: status,
        res: response,
        req: request,
      });
    } catch {
      // Continue if logging fails
    }

    response
      .status(status)
      .send({
        statusCode: status,
        message: message,
        error: name,
        timestamp: new Date().toISOString(),
        path: request?.url,
      })
      .raw?.uncork();
  }

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const i18n = I18nContext.current<I18nTranslations>(host);
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException && typeof exception.getStatus === 'function') {
      try {
        status = exception.getStatus();
      } catch {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }

    const hostType = host.getType<GqlContextType>();

    if (hostType === 'graphql') {
      const gqlContext = host.getArgByIndex<GraphQLContext>(2);
      let response =
        exception instanceof HttpException
          ? exception.getResponse()
          : { message: exception.message, error: exception.name };
      const query = host.getArgByIndex(3);

      const validationMessages = this.handleI18nValidationException(exception, i18n);
      const isI18nValidationHandled = validationMessages && validationMessages.length > 0;

      if (isI18nValidationHandled) {
        const translatedMessage = validationMessages.join(', ');
        const newException = new BadRequestException(translatedMessage);
        exception = newException;
        response = newException.getResponse();
      }

      if (typeof response === 'object' && response !== null) {
        if ('message' in response && 'error' in response) {
          const { error = exception?.name || 'HttpException', message } = response;

          if (!isI18nValidationHandled) {
            if (Array.isArray(message)) {
              const messages: string[] = [];
              for (const msg of message) {
                if (msg != null) {
                  try {
                    const tMsg = typeof i18n?.t === 'function' ? i18n.t<I18nPath>(msg as I18nPath) : msg;
                    messages.push(tMsg || msg);
                  } catch {
                    messages.push(msg);
                  }
                }
              }
              exception.message = `${error as string}: ${messages.join(', ')}`;
            } else if (message != null) {
              try {
                const msg =
                  typeof i18n?.t === 'function'
                    ? i18n.t<I18nPath>((message as I18nPath) ?? 'user.unknownError')
                    : (message as string);
                exception.message = `${error as string}: ${(msg || message) as string}`;
              } catch {
                exception.message = `${error as string}: ${message as string}`;
              }
            } else {
              exception.message = `${error as string}: ${exception?.message}`;
            }
          }
        }
      } else if (!isI18nValidationHandled) {
        try {
          const msg =
            typeof i18n?.t === 'function'
              ? i18n.t<I18nPath>((exception?.message as I18nPath) ?? 'user.unknownError')
              : exception?.message;
          exception.message = `${exception?.name || 'HttpException'}: ${(msg as string) || exception?.message}`;
        } catch {
          exception.message = `${exception?.name || 'HttpException'}: ${exception?.message}`;
        }
      }

      let body = gqlContext?.['__currentQuery'] ?? host.getArgByIndex(0);
      if (body && typeof body === 'string' && body.length > 1000) {
        body = `${body.substring(0, 1000)}...`;
      }

      try {
        this.logger?.trace({
          msg: exception?.message,
          userId: gqlContext?.userId,
          roleId: gqlContext?.roleId,
          roleType: gqlContext?.roleType,
          language: gqlContext?.language,
          context: query?.fieldName,
          error: exception,
          body,
          statusCode: status,
          res: gqlContext?.reply,
          req: gqlContext?.req,
        });
      } catch {
        // Continue if logging fails
      }

      if (exception instanceof HttpException && typeof exception.initCause === 'function') {
        try {
          exception.initCause();
        } catch {
          // Continue if initCause fails
        }
      }
      exception.cause = { error: exception?.name || 'HttpException', message: exception?.message || 'Unknown error' };
      gqlContext?.reply?.status?.(status);

      if (isI18nValidationHandled && gqlContext?.reply) {
        try {
          gqlContext.reply.code(HttpStatus.OK).send({
            data: null,
            errors: [
              {
                message: exception.message,
              },
            ],
          });
          return;
        } catch {
          // If manual send fails, continue with default error handling
        }
      }

      return;
    } else if (hostType === 'ws') {
      const wsContext = host.getArgByIndex(2);
      const response =
        exception instanceof HttpException
          ? exception.getResponse()
          : { message: exception.message, error: exception.name };
      const query = host.getArgByIndex(3);

      const validationMessages = this.handleI18nValidationException(exception, i18n);
      const isI18nValidationHandled = validationMessages && validationMessages.length > 0;

      if (isI18nValidationHandled) {
        const translatedMessage = validationMessages.join(', ');
        exception.message = `Bad Request: ${translatedMessage}`;
      }

      if (!isI18nValidationHandled && typeof response === 'object' && response !== null) {
        if ('message' in response && 'error' in response) {
          const { error = exception?.name || 'HttpException', message } = response;
          if (Array.isArray(message)) {
            const messages: string[] = [];
            for (const msg of message) {
              if (msg != null) {
                try {
                  const tMsg = typeof i18n?.t === 'function' ? i18n.t<I18nPath>(msg as I18nPath) : msg;
                  messages.push(tMsg || msg);
                } catch {
                  messages.push(msg);
                }
              }
            }
            exception.message = `${error as string}: ${messages.join(', ')}`;
          } else if (message != null) {
            try {
              const msg = typeof i18n?.t === 'function' ? i18n.t<I18nPath>(message as I18nPath) : (message as string);
              exception.message = `${error as string}: ${(msg || message) as string}`;
            } catch {
              exception.message = `${error as string}: ${message as string}`;
            }
          }
        }
      }

      try {
        this.logger?.trace({
          msg: exception?.message,
          userId: wsContext?.userId,
          roleId: wsContext?.roleId,
          roleType: wsContext?.roleType,
          language: wsContext?.language,
          context: query?.fieldName,
          error: exception,
          body: wsContext?.body,
          statusCode: status,
          res: wsContext?.reply,
          req: wsContext?.req,
        });
      } catch {
        // Continue if logging fails
      }

      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const validationMessages = this.handleI18nValidationException(exception, i18n);
    if (validationMessages && validationMessages.length > 0) {
      exception.message = `Bad Request: ${validationMessages.join(', ')}`;
    }

    try {
      this.logger?.trace({
        msg: exception?.message,
        userId: request?.userId,
        roleId: request?.roleId,
        roleType: request?.roleType,
        language: request?.language,
        context: 'HTTP',
        statusCode: status,
        res: response,
        req: request,
      });
    } catch {
      // Continue if logging fails
    }

    response
      .status(status)
      .send({
        statusCode: status,
        message: exception?.message || `${exception?.name || 'HttpException'}: Internal server error`,
        error: exception?.name || 'HttpException',
        timestamp: new Date().toISOString(),
        path: request?.url,
      })
      .raw?.uncork();
  }
}
