export type CurrencyType = 'star-credits' | 'earth-points';

export const formatCurrency = (amount: number, currency: CurrencyType): string => {
  const formatted = amount.toLocaleString();

  if (currency === 'star-credits') {
    return `⭐ ${formatted} Star Credits`;
  } else {
    return `🌍 ${formatted} Earth Points`;
  }
};

export const formatCurrencyShort = (amount: number, currency: CurrencyType): string => {
  const formatted = amount.toLocaleString();

  if (currency === 'star-credits') {
    return `⭐ ${formatted}`;
  } else {
    return `🌍 ${formatted}`;
  }
};

export const getCurrencySymbol = (currency: CurrencyType): string => {
  return currency === 'star-credits' ? '⭐' : '🌍';
};

export const getCurrencyName = (currency: CurrencyType): string => {
  return currency === 'star-credits' ? 'Star Credits' : 'Earth Points';
};
