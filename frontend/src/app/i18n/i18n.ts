import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import csCommon from "./locales/cs/common.json";
import enCommon from "./locales/en/common.json";

void i18n.use(initReactI18next).init({
  resources: {
    cs: {
      common: csCommon,
    },
    en: {
      common: enCommon,
    },
  },
  lng: "cs",
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common"],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
