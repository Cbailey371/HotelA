"use server";

import { cookies } from "next/headers";

const locales = ["en", "es"] as const;
const defaultLocale: Locale = "es";
export type Locale = (typeof locales)[number];

const COOKIE_NAME = "NEXT_LOCALE";

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale;
}

export async function setUserLocale(locale: Locale) {
  (await cookies()).set(COOKIE_NAME, locale);
}
