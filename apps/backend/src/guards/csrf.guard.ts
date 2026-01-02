import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * CSRF Protection Guard using Double Submit Cookie Pattern
 *
 * This guard validates CSRF tokens for mutations to prevent Cross-Site Request Forgery attacks.
 *
 * ## How it works:
 * 1. Login mutation generates a CSRF token and sets it as a non-httpOnly cookie
 * 2. Client reads the token from the cookie and sends it in the X-CSRF-Token header
 * 3. Guard validates that the cookie value matches the header value
 *
 * ## Automatic Exemptions:
 * - GraphQL queries (only mutations need CSRF protection)
 * - Requests when auth.csrf.enabled = false in config
 * - GraphiQL requests in non-production environments
 * - Public mutations: login, requestMagicLink, authenticateWithMagicLink, oauthAuthenticate
 *
 * ## Usage:
 *
 * ### Option 1: Apply globally to all mutations (recommended for production)
 * In app.module.ts:
 * ```typescript
 * import { CsrfGuard } from './guards/csrf.guard';
 *
 * providers: [
 *   {
 *     provide: APP_GUARD,
 *     useClass: CsrfGuard,
 *   },
 * ],
 * ```
 *
 * ### Option 2: Apply selectively to specific resolvers
 * On specific resolver or mutation:
 * ```typescript
 * import { UseGuards } from '@nestjs/common';
 * import { CsrfGuard } from '@/guards/csrf.guard';
 *
 * @UseGuards(CsrfGuard)
 * @Mutation(() => SomeDto)
 * async someSensitiveMutation() { ... }
 * ```
 *
 * ## Client Integration:
 *
 * ### Apollo Client (React):
 * ```typescript
 * import { setContext } from '@apollo/client/link/context';
 *
 * const csrfLink = setContext((_, { headers }) => {
 *   const csrfToken = document.cookie
 *     .split('; ')
 *     .find(row => row.startsWith('csrf-token='))
 *     ?.split('=')[1];
 *
 *   return {
 *     headers: {
 *       ...headers,
 *       'x-csrf-token': csrfToken || '',
 *     }
 *   };
 * });
 * ```
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const csrfEnabled = this.configService.get<boolean>('auth.csrf.enabled', false);
    if (!csrfEnabled) {
      return true; // CSRF protection disabled
    }

    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();
    const req = ctx.req;
    const info = gqlContext.getInfo();

    // Skip CSRF check for GraphiQL in non-production environments
    const graphiqlEnabled = this.configService.get<boolean>('graphql.graphiql', false);
    const environment = this.configService.get<string>('host.environment', 'development');
    const isGraphiqlRequest = req.headers.referer?.includes('/graphiql') ||
                              req.headers['x-graphiql'] === 'true';

    if (graphiqlEnabled && environment !== 'production' && isGraphiqlRequest) {
      return true; // Allow GraphiQL requests in development
    }

    // In GraphQL, all requests are POST. Check operation type instead of HTTP method.
    // Only mutations need CSRF protection, queries are safe (read-only)
    const operationType = info?.operation?.operation;
    if (operationType !== 'mutation') {
      return true; // Allow queries, subscriptions, introspection
    }

    // Public mutations that don't require CSRF token (user doesn't have token yet)
    const operationName = info?.fieldName;

    const publicMutations = [
      'login',
      'requestMagicLink',
      'authenticateWithMagicLink',
      'oauthAuthenticate',
    ];

    if (operationName && publicMutations.includes(operationName)) {
      return true; // Allow public mutations without CSRF token
    }

    // Read CSRF token from cookie
    const csrfCookie = req.cookies?.['csrf-token'];
    // Read CSRF token from header
    const csrfHeader = req.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    return true;
  }
}
