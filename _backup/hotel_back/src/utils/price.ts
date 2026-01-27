type amountFormatterProps = (
  amount: number,
  numberFormatOptions?: {
    country?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
) => string;

export const amountFormatter: amountFormatterProps = (
  amount = 0,
  {
    country = 'en-US',
    currency = 'USD',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = {},
) =>
  new Intl.NumberFormat(country, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
