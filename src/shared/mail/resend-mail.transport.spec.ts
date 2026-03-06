import { ResendMailTransport } from './resend-mail.transport';
import type { ConfigService } from '@nestjs/config';
import type { AllConfigType } from '@/core/config/config.type';
import { PinoLogger } from 'pino-nestjs';
import { Resend } from 'resend';

jest.mock('resend');

describe('ResendMailTransport', () => {
  const mailConfig = {
    resendApiKey: 'test-key',
    from: 'Help <no-reply@example.com>',
    replyTo: 'support@example.com',
  } as const;

  const configService = {
    getOrThrow: jest.fn().mockReturnValue(mailConfig),
    get: jest.fn().mockReturnValue(mailConfig),
  } as unknown as ConfigService<AllConfigType>;

  const logger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as PinoLogger;

  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.getOrThrow as jest.Mock).mockReturnValue(mailConfig);
    (configService.get as jest.Mock).mockReturnValue(mailConfig);

    sendMock = jest
      .fn()
      .mockResolvedValue({ data: { id: 'email_123' }, error: null });
    (Resend as jest.Mock).mockImplementation(() => ({
      emails: {
        send: sendMock,
      },
    }));
  });

  test('sends email via Resend SDK and returns providerMessageId', async () => {
    const transport = new ResendMailTransport(configService, logger);
    transport.onModuleInit();

    const result = await transport.send({
      to: 'user@example.com',
      subject: 'Subject',
      html: '<p>Hello</p>',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    );
    expect(result.providerMessageId).toBe('email_123');
  });

  test('throws when Resend SDK is not initialized', async () => {
    (configService.get as jest.Mock).mockReturnValue({
      ...mailConfig,
      resendApiKey: undefined,
    });
    const transport = new ResendMailTransport(configService, logger);
    transport.onModuleInit();

    await expect(
      transport.send({
        to: 'user@example.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    ).rejects.toThrow('Mail provider not configured');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(logger.error).toHaveBeenCalledWith(
      'Resend SDK is not initialized (missing API key)',
    );
  });

  test('handles SDK errors', async () => {
    const transport = new ResendMailTransport(configService, logger);
    transport.onModuleInit();

    sendMock.mockResolvedValue({ data: null, error: { message: 'API Error' } });

    await expect(
      transport.send({
        to: 'user@example.com',
        subject: 'Subject',
        html: '<p>Hello</p>',
      }),
    ).rejects.toThrow('Failed to send email: API Error');
  });
});
