export const AUTH_NAME_MIN_LENGTH = 4;
export const AUTH_LOGIN_MIN_LENGTH = 4;
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_FIELD_MAX_LENGTH = 40;

function getTrimmedLength(value: string) {
  return value.trim().length;
}

export function validateName(name: string): string | null {
  const length = getTrimmedLength(name);

  if (length < AUTH_NAME_MIN_LENGTH) {
    return `Name must be at least ${AUTH_NAME_MIN_LENGTH} characters long.`;
  }

  if (length > AUTH_FIELD_MAX_LENGTH) {
    return `Name must be at most ${AUTH_FIELD_MAX_LENGTH} characters long.`;
  }

  return null;
}

export function validateLogin(login: string): string | null {
  const length = getTrimmedLength(login);

  if (length < AUTH_LOGIN_MIN_LENGTH) {
    return `Login must be at least ${AUTH_LOGIN_MIN_LENGTH} characters long.`;
  }

  if (length > AUTH_FIELD_MAX_LENGTH) {
    return `Login must be at most ${AUTH_FIELD_MAX_LENGTH} characters long.`;
  }

  return null;
}

export function validatePassword(password: string): string | null {
  const length = getTrimmedLength(password);

  if (length < AUTH_PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters long.`;
  }

  if (length > AUTH_FIELD_MAX_LENGTH) {
    return `Password must be at most ${AUTH_FIELD_MAX_LENGTH} characters long.`;
  }

  return null;
}
