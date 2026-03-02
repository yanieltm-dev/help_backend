export interface MailService {
  sendVerificationEmail(to: string, token: string): Promise<void>;
}

export const MAIL_SERVICE = Symbol('MAIL_SERVICE');
