import { Injectable, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';

/**
 * Custom ThrottlerGuard that works with both GraphQL and REST endpoints
 *
 * Features:
 * - Supports both GraphQL and REST endpoints
 * - Uses user ID for authenticated users (more accurate than IP)
 * - Falls back to IP address for anonymous users
 * - Properly handles proxy headers (X-Forwarded-For, X-Real-IP)
 */
@Injectable()
export class GraphqlThrottlerGuard extends ThrottlerGuard {
  /**
   * Extract request from GraphQL or HTTP context
   */
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();

    // GraphQL context
    if (ctx?.req) {
      return { req: ctx.req, res: ctx.reply };
    }

    // HTTP/REST context (fallback to parent implementation)
    return super.getRequestResponse(context);
  }

  /**
   * Get tracker string for rate limiting
   * Prioritizes user ID for authenticated requests, falls back to IP address
   */
  protected async getTracker(req: FastifyRequest): Promise<string> {
    // Try to get user ID from request (set by JWT auth guard)
    const user = (req as any).user;
    if (user?.id) {
      // Use user ID for authenticated users
      // Prefix with 'user:' to distinguish from IP-based tracking
      return `user:${user.id}`;
    }

    // For anonymous users, use IP address
    return this.getIpAddress(req);
  }

  /**
   * Extract IP address from request headers
   * Handles proxy headers (X-Forwarded-For, X-Real-IP)
   */
  private getIpAddress(req: FastifyRequest): string {
    // Try to get IP from X-Forwarded-For header (if behind proxy)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return `ip:${ips.split(',')[0].trim()}`;
    }

    // Use X-Real-IP header
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      const ip = Array.isArray(realIp) ? realIp[0] : realIp;
      return `ip:${ip}`;
    }

    // Fallback to socket IP
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `ip:${ip}`;
  }

  /**
   * Custom error handler with more informative message
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }
}
