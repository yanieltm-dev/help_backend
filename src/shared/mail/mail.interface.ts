export type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
};

export type TransportSendResult = {
  providerMessageId?: string;
};

export interface MailTransport {
  send(email: TransactionalEmail): Promise<TransportSendResult>;
}

export interface MailService {
  sendTransactionalEmail(
    email: TransactionalEmail,
  ): Promise<TransportSendResult>;

  sendVerificationEmail(
    to: string,
    otp: string,
    name: string,
    otpExpiresInMs: number,
  ): Promise<void>;

  sendPasswordResetEmail(
    to: string,
    otp: string,
    name: string,
    otpExpiresInMs: number,
  ): Promise<void>;
}

export const MAIL_SERVICE = Symbol('MAIL_SERVICE');
export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');
