import { GraphQLContext, GraphQLWebSocketContext } from '@/interfaces/graphql-context.interface';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PinoLogger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new PinoLogger({ pinoHttp: { level: 'debug' } });

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(tap((data) => this.log(context, data)));
  }

  private log(context: ExecutionContext, data: any) {
    const type = context.getType<GqlContextType>();
    let ctx: GraphQLContext | GraphQLWebSocketContext | FastifyRequest;
    let reply: FastifyReply | undefined;
    let body: any;
    if (type === 'graphql') {
      ctx = GqlExecutionContext.create(context).getContext<GraphQLContext>();
      reply = ctx.reply;
      body = ctx?.['__currentQuery'] ?? context.getArgByIndex(0);
    } else if (type === 'ws') {
      ctx = context.switchToWs().getClient<GraphQLWebSocketContext>();
      reply = ctx.reply;
      body = context.switchToWs().getData();
    } else if (type === 'http') {
      ctx = context.switchToHttp().getRequest<FastifyRequest>();
      reply = context.switchToHttp().getResponse<FastifyReply>();
    } else {
      return;
    }
    if (body && body.length > 1000) {
      body = `${body.substring(0, 1000)}...`;
    }
    const { userId, roleId, roleType, language, req } = ctx;

    this.logger.trace({
      userId,
      roleId,
      roleType,
      language,
      context: context.getClass().name ?? 'HTTP',
      res: reply,
      req,
      body,
      msg: data,
    });
  }
}
