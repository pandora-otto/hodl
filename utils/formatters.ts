export function formatPrice(price: number, symbol: string = '$'): string {
    if (price === 0) return `${symbol}0`;

    const isNegative = price < 0;
    const absPrice = Math.abs(price);

    // For numbers < 1, we need 5 decimal places (0 + 5 digits = 6 total)
    // For numbers >= 1, we need to limit total digits to 6
    const maximumFractionDigits =
        absPrice < 1 ? 5 : Math.max(0, 6 - Math.floor(absPrice).toString().length);

    const formatted = absPrice.toLocaleString('en-US', {
        maximumFractionDigits,
        minimumFractionDigits: 0,
        useGrouping: true,
    });

    return (isNegative ? '-' : '') + symbol + formatted;
}

// export function formatPrice(price: number): string {
//   if (price >= 1) {
//     return '$' + price.toLocaleString('en-US', {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     });
//   }
//   return '$' + price.toLocaleString('en-US', {
//     minimumFractionDigits: 4,
//     maximumFractionDigits: 6,
//   });
// }

export function formatPercent(value: number): string {
    const sign = value >= 0 ? '+' : '';
    const abs = Math.abs(value);

    let formatted: string;
    if (abs >= 100) {
        formatted = abs.toFixed(0);
    } else if (abs >= 10) {
        formatted = abs.toFixed(1);
    } else {
        formatted = abs.toFixed(2);
    }

    return `${sign}${value < 0 ? '-' : ''}${formatted}%`;
}

export function formatMarketCap(value: number, symbol: string = '$'): string {
    if (value >= 1_000_000_000) {
        return symbol + (value / 1_000_000_000).toFixed(2) + 'B';
    }
    if (value >= 1_000_000) {
        return symbol + (value / 1_000_000).toFixed(2) + 'M';
    }
    return symbol + value.toLocaleString('en-US');
}

export function formatSupply(value: number, symbol: string): string {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 }) + ' ' + symbol.toUpperCase();
}
