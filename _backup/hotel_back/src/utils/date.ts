import { format, Locale } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

export const dateFnsLanguage = (lang?: string): Locale => {
  // const lang = userPreferredLanguage();
  const validLanguages = { es: es, en: enUS };
  return validLanguages[lang as keyof typeof validLanguages] || es;
};

export const formatDate = (
  date: Date | string,
  formater: string = 'dd/MM/yy',
  locale: string = 'es',
) => {
  if (typeof date === 'string') date = new Date(date);
  if (!date) return 'No aplica';
  date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return capitalizer(
    format(date, formater, {
      locale: dateFnsLanguage(locale),
    }),
  );
};

export function formatDateUTC(
  date: Date | string | undefined,
  formatStr: string,
  locale: string = 'es',
): string {
  if (!date) return 'No aplica';
  return capitalizer(
    formatInTimeZone(date, 'UTC', formatStr, {
      locale: dateFnsLanguage(locale),
    }),
  );
}

export const capitalizer = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);
