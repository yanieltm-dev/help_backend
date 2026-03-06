import { MailService } from './mail.service';
import type { PinoLogger } from 'pino-nestjs';
import type { MailTransport } from './mail.interface';
import { ConfigService } from '@nestjs/config';

function createConfigServiceMock(overrides?: {
  appName?: string;
  backendDomain?: string;
}) {
  const app = {
    name: overrides?.appName ?? 'Help',
    backendDomain: overrides?.backendDomain ?? 'http://localhost:3000',
  };

  return {
    get: jest.fn((key: string) => {
      if (key === 'app') return app;
      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'app') return app;
      throw new Error(`Missing config key: ${key}`);
    }),
  } as unknown as ConfigService;
}

describe('MailService', () => {
  test('sendVerificationEmail does not log OTP/token', async () => {
    const logger = {
      info: jest.fn(),
    } as unknown as PinoLogger;

    const transport: MailTransport = {
      send: jest.fn().mockResolvedValue({}),
    };

    const configService = createConfigServiceMock();
    const service = new MailService(logger, transport, configService);

    await service.sendVerificationEmail(
      'user@example.com',
      '123456',
      'Alice',
      600000,
    );

    const allInfoArgs = (logger.info as jest.Mock).mock.calls
      .flat()
      .map((arg: unknown) =>
        typeof arg === 'string' ? arg : JSON.stringify(arg),
      );

    expect(allInfoArgs.join(' ')).not.toContain('123456');
  });

  test('sendTransactionalEmail delegates to transport', async () => {
    const logger = {
      info: jest.fn(),
    } as unknown as PinoLogger;

    const transport: MailTransport = {
      send: jest.fn().mockResolvedValue({ providerMessageId: 'msg_1' }),
    };

    const configService = createConfigServiceMock();
    const service = new MailService(logger, transport, configService);

    await service.sendTransactionalEmail({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    );
  });
});
