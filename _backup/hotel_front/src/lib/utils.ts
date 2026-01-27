import { IParams } from "./definitions";
import { format, Locale } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { PhoneNumberUtil } from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();

export const isPhoneValid = (phone: string) => {
  try {
    return phoneUtil.isValidNumber(phoneUtil.parseAndKeepRawInput(phone));
  } catch (error) {
    return false;
  }
};

export const buildParamsUrl = (params: IParams) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", params.page.toString());
  }

  let where: string[] = [];

  if (params.where) {
    if (typeof params.where === "string") {
      params.where = JSON?.parse(params.where as any) || params.where;
    }

    if (!Array.isArray(params.where)) {
      params.where = [(params.where as any) || params.where];
    }

    if (Array.isArray(params.where)) {
      params.where.map(
        ({ key, value, valueType = "string", operator = "contains" }) => {
          operator = operator === "empty" ? "" : operator;
          if (valueType != "string" && operator == "contains") {
            operator = "";
          }
          if (valueType === "int" && Number.isInteger(Number(value))) {
            where.push(`${key}: ${operator} int(${value})`);
          } else if (valueType === "float" && !isNaN(Number(value))) {
            where.push(`${key}: ${operator} float(${value})`);
          } else if (valueType === "string") {
            where.push(`${key}: ${operator} ${value}`);
          } else if (valueType === "date") {
            where.push(`${key}: ${operator} date(${value})`);
          } else if (valueType === "array" && Array.isArray(value)) {
            where.push(`${key}: ${operator} array(${value.join(",")})`);
          } else if (valueType === "boolean") {
            where.push(`${key}: ${operator} boolean(${value})`);
          }
        }
      );
    }
  }

  if (where.length > 0) {
    let encodedWhere = encodeURIComponent(where.join(","));
    if (
      params.operator === "OR" ||
      params.operator === "AND" ||
      params.operator === "NOT"
    ) {
      encodedWhere = encodeURIComponent(`[${where.join(",")}]`);
    }
    let searchValue = encodedWhere;
    if (params.operator === "OR") {
      searchValue = `OR:${encodedWhere}`;
    } else if (params.operator === "AND") {
      searchValue = `AND:${encodedWhere}`;
    } else if (params.operator === "NOT") {
      searchValue = `NOT:${encodedWhere}`;
    }
    searchParams.set("where", searchValue);
  }

  if (Array.isArray(params.select)) {
    searchParams.set("select", params.select.join(","));
  }

  if (Array.isArray(params.include)) {
    searchParams.set("include", params.include.join(","));
  }

  // Esto se hace porque el backend no acepta ambos elementos al mismo tiempo, por lo que se debe eliminar el include si se usa el select
  if (Array.isArray(params.select) && Array.isArray(params.include)) {
    searchParams.delete("include");
  }

  if (Array.isArray(params.orderBy)) {
    searchParams.set("orderBy", params?.orderBy.join(","));
  }
  if (typeof params.orderBy === "string") {
    searchParams.set("orderBy", params.orderBy);
  }

  if (params.perPage) {
    searchParams.set("perPage", params.perPage.toString());
  }
  if (params.langCode) {
    searchParams.set("langCode", params.langCode.toString());
  }
  return `?${searchParams.toString()}`;
};

export const dateFnsLanguage = (lang?: string): Locale => {
  // const lang = userPreferredLanguage();
  const validLanguages = { es: es, en: enUS };
  return validLanguages[lang as keyof typeof validLanguages] || es;
};

export const formatDate = (
  date: Date | string,
  formater: string = "dd/MM/yy",
  locale: string = "es"
) => {
  if (typeof date === "string") date = new Date(date);
  date = new Date(date?.getTime() + date?.getTimezoneOffset() * 60000);
  return capitalizer(
    format(date, formater, {
      locale: dateFnsLanguage(locale),
    })
  );
};

export function formatDateUTC(
  date: Date | string | undefined,
  formatStr: string,
  locale: string = "es"
): string {
  if (!date) return "";
  return capitalizer(
    formatInTimeZone(date, "UTC", formatStr, {
      locale: dateFnsLanguage(locale),
    })
  );
}

export const capitalizer = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

type amountFormatterProps = (
  amount: number,
  numberFormatOptions?: {
    country?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
) => string;

export const amountFormatter: amountFormatterProps = (
  amount = 0,
  {
    country = "en-US",
    currency = "USD",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = {}
) =>
  new Intl.NumberFormat(country, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);

type ApiError = {
  success: false;
  error: {
    code: number;
    message: string;
    details?: Record<string, string[]>;
  };
};

export function mapApiErrors(error: unknown): string[] {
  const errorMessages: string[] = [];

  if (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as any).error === "object"
  ) {
    const errObj = error as ApiError;

    if (Array.isArray(errObj.error.details)) {
      for (const detail of errObj.error.details) {
        for (const [field, messages] of Object.entries(detail)) {
          (messages as string[])?.forEach((msg) => {
            errorMessages.push(msg);
          });
        }
      }
    }
    if (errObj.error.message) {
      errorMessages.push(errObj.error.message);
    }
  }

  return errorMessages;
}

export const downloadBlob = (data: Blob, filename: string) => {
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const isFileDifferent = async (file?: File, fileUrl?: string) => {
  if (!fileUrl || !file) return true;
  const response = await fetch(fileUrl);
  const originalArrayBuffer = await response.arrayBuffer();
  const newArrayBuffer = await file.arrayBuffer();

  if (originalArrayBuffer.byteLength !== newArrayBuffer.byteLength) return true;

  const origView = new Uint8Array(originalArrayBuffer);
  const newView = new Uint8Array(newArrayBuffer);

  for (let i = 0; i < origView.length; i++) {
    if (origView[i] !== newView[i]) return true;
  }
  return false;
};
