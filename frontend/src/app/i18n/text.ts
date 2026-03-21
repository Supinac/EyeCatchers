import i18n from "./i18n";

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function translateValue(value: string | number | undefined | null) {
  if (value == null) {
    return "—";
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return "—";
  }

  const lower = normalized.toLowerCase();
  const key = `values.${lower}`;
  return i18n.exists(key) ? i18n.t(key) : normalized;
}

export function translateGameTitle(gameKey: string) {
  const key = `games.items.${gameKey}.title`;
  return i18n.exists(key) ? i18n.t(key) : titleCase(gameKey);
}

export function translateGameDescription(gameKey: string) {
  const key = `games.items.${gameKey}.description`;
  return i18n.exists(key) ? i18n.t(key) : "";
}

export function formatTokenLabel(value: string | undefined) {
  if (!value) {
    return "—";
  }

  const translated = translateValue(value);
  return translated === value
    ? value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : translated;
}
