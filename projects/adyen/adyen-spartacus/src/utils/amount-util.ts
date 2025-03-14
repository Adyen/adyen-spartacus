interface Amount {
  currency: string;
  value: number;
}
export class AmountUtil {
  /**
   * Creates an Amount object with the specified value and currency
   */
  public static createAmount(value: number, currency: string): Amount {
    if (value === null || value === undefined) {
      throw new Error('Value cannot be null');
    }
    if (!currency || currency.trim() === '') {
      throw new Error('Currency cannot be null or empty');
    }

    const scale = this.getDecimalPlaces(currency);
    const scaledValue = Math.round(value * Math.pow(10, scale));

    return {
      currency,
      value: scaledValue
    };
  }

  /**
   * Gets the number of decimal places for a given currency
   */
  public static getDecimalPlaces(currency: string): number {
    const zeroDpCurrencies = [
      'CVE', 'DJF', 'GNF', 'IDR', 'JPY', 'KMF', 'KRW',
      'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
    ];

    const threeDpCurrencies = [
      'BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'
    ];

    if (zeroDpCurrencies.includes(currency)) {
      return 0;
    }

    if (threeDpCurrencies.includes(currency)) {
      return 3;
    }

    return 2;
  }
}
