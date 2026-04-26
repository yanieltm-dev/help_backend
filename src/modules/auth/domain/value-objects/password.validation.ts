export const PASSWORD_VALIDATION_REGEX =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;

export const PASSWORD_VALIDATION_MESSAGE =
  'Password must be at least 8 characters with one number, one uppercase, one lowercase, and one special character';
