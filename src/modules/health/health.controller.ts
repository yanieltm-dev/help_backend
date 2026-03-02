import { AllConfigType } from '@/core/config/config.type';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
} from '@nestjs/terminus';
import { InjectPinoLogger, PinoLogger } from 'pino-nestjs';

@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(
    private health: HealthCheckService,
    @InjectPinoLogger(HealthController.name)
    private logger: PinoLogger,
    private configService: ConfigService<AllConfigType>,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    const appName = this.configService.getOrThrow('app.name', { infer: true });
    const appPort = this.configService.getOrThrow('app.port', { infer: true });

    this.logger.info(`Health check: ${appName} running on port ${appPort}`);

    return this.health.check([
      () => ({
        application: {
          status: 'up',
          name: appName,
          port: appPort,
        },
      }),
    ]);
  }
}
