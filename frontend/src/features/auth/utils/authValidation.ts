export const AUTH_NAME_MIN_LENGTH = 4;
export const AUTH_LOGIN_MIN_LENGTH = 4;
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_TEXT_MAX_LENGTH = 40;

function isBlank(value: string) {
  return value.trim().length === 0;
}

function hasExceededMaxLength(value: string) {
  return value.trim().length > AUTH_TEXT_MAX_LENGTH;
}

export function validateName(value: string) {
  const trimmedValue = value.trim();

  if (isBlank(value)) {
    return "Please enter name.";
  }

  if (trimmedValue.length < AUTH_NAME_MIN_LENGTH) {
    return `Name must be at least ${AUTH_NAME_MIN_LENGTH} characters long.`;
  }

  if (hasExceededMaxLength(value)) {
    return `Name must be at most ${AUTH_TEXT_MAX_LENGTH} characters long.`;
  }

  return "";
}

export function validateLogin(value: string, label = "Login") {
  const trimmedValue = value.trim();

  if (isBlank(value)) {
    return `Please enter ${label.toLowerCase()}.`;
  }

  if (trimmedValue.length < AUTH_LOGIN_MIN_LENGTH) {
    return `${label} must be at least ${AUTH_LOGIN_MIN_LENGTH} characters long.`;
  }

  if (hasExceededMaxLength(value)) {
    return `${label} must be at most ${AUTH_TEXT_MAX_LENGTH} characters long.`;
  }

  return "";
}

export function validatePassword(value: string, label = "Password") {
  const trimmedValue = value.trim();

  if (isBlank(value)) {
    return `Please enter ${label.toLowerCase()}.`;
  }

  if (trimmedValue.length < AUTH_PASSWORD_MIN_LENGTH) {
    return `${label} must be at least ${AUTH_PASSWORD_MIN_LENGTH} characters long.`;
  }

  if (hasExceededMaxLength(value)) {
    return `${label} must be at most ${AUTH_TEXT_MAX_LENGTH} characters long.`;
  }

  return "";
}
