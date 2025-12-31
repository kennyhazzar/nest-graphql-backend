import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

/**
 * Health Check Controller
 *
 * SECURITY NOTE: These endpoints are publicly accessible for Kubernetes/Docker health probes.
 * In production, consider:
 * 1. Moving to a separate internal port (e.g., :9000/health)
 * 2. Adding IP whitelist guard to restrict access
 * 3. Using firewall rules to block external access
 *
 * These endpoints should only be accessible from:
 * - Kubernetes liveness/readiness probes
 * - Load balancer health checks
 * - Internal monitoring systems
 */
@Controller('health')
@SkipThrottle() // Skip rate limiting for health checks
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /**
   * Basic health check
   * Checks: Database connectivity + Memory usage
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),

      // Memory heap check (should not exceed 1GB)
      () => this.memory.checkHeap('memory_heap', 1024 * 1024 * 1024),

      // Memory RSS check (should not exceed 1.5GB)
      () => this.memory.checkRSS('memory_rss', 1536 * 1024 * 1024),
    ]);
  }

  /**
   * Readiness probe for Kubernetes
   * Only checks if database is reachable
   */
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      // Check if database is ready
      () => this.db.pingCheck('database'),
    ]);
  }

  /**
   * Liveness probe for Kubernetes
   * Always returns 200 OK if app is running
   * Does not check external dependencies
   */
  @Get('live')
  alive() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
