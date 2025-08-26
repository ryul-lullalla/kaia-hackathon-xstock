import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Big from "big.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string, decimals = 2): string {
  try {
    const bigValue = new Big(value);

    const billion = new Big(1e9);
    const million = new Big(1e6);
    const thousand = new Big(1e3);

    let result: string;
    if (bigValue.gte(billion)) {
      result = bigValue.div(billion).toFixed(decimals) + "B";
    } else if (bigValue.gte(million)) {
      result = bigValue.div(million).toFixed(decimals) + "M";
    } else if (bigValue.gte(thousand)) {
      result = bigValue.div(thousand).toFixed(decimals) + "K";
    } else {
      result = bigValue.toFixed(decimals);
    }

    // Remove trailing zeros and decimal point if all decimals are zero
    return result
      .replace(/\.0+([KMB]?)$/, "$1")
      .replace(/(\.\d*?)0+([KMB]?)$/, "$1$2");
  } catch {
    return "0";
  }
}

export function formatCurrency(
  value: number | string,
  currency = "USD"
): string {
  try {
    const bigValue = new Big(value);
    const num = Number(bigValue.toString());

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(num);
  } catch {
    return "$0.00";
  }
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTokenAmount(
  amount: bigint | string | number | undefined | null,
  decimals = 18,
  displayDecimals = 4
): string {
  if (!amount || amount === 0) return "0";

  try {
    let bigValue: Big;

    if (typeof amount === "bigint") {
      bigValue = new Big(amount.toString()).div(new Big(10).pow(decimals));
    } else if (typeof amount === "string") {
      bigValue = new Big(amount);
    } else {
      bigValue = new Big(amount);
    }

    return bigValue.toFixed(displayDecimals);
  } catch {
    return "0";
  }
}

// Type for values that can be converted to Big
type BigInput = string | number | bigint | Big;

/**
 * Safe wrapper for Big.js operations
 * Provides precise arithmetic calculations for financial operations
 */
export class SafeMath {
  /**
   * Convert input to Big instance safely
   */
  private static toBig(value: BigInput): Big {
    if (value instanceof Big) return value;
    if (typeof value === "bigint") return new Big(value.toString());
    return new Big(value);
  }

  /**
   * Safe addition
   * @param a First number
   * @param b Second number
   * @returns Result of a + b
   */
  static add(a: BigInput, b: BigInput): Big {
    try {
      return SafeMath.toBig(a).plus(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.add error:", error);
      return new Big(0);
    }
  }

  /**
   * Safe subtraction
   * @param a First number
   * @param b Second number
   * @returns Result of a - b
   */
  static subtract(a: BigInput, b: BigInput): Big {
    try {
      return SafeMath.toBig(a).minus(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.subtract error:", error);
      return new Big(0);
    }
  }

  /**
   * Safe multiplication
   * @param a First number
   * @param b Second number
   * @returns Result of a * b
   */
  static multiply(a: BigInput, b: BigInput): Big {
    try {
      return SafeMath.toBig(a).times(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.multiply error:", error);
      return new Big(0);
    }
  }

  /**
   * Safe division
   * @param a Dividend
   * @param b Divisor
   * @returns Result of a / b
   */
  static divide(a: BigInput, b: BigInput): Big {
    try {
      const divisor = SafeMath.toBig(b);
      if (divisor.eq(0)) {
        console.error("SafeMath.divide: Division by zero");
        return new Big(0);
      }
      return SafeMath.toBig(a).div(divisor);
    } catch (error) {
      console.error("SafeMath.divide error:", error);
      return new Big(0);
    }
  }

  /**
   * Safe power operation
   * @param base Base number
   * @param exponent Exponent
   * @returns Result of base ^ exponent
   */
  static power(base: BigInput, exponent: number): Big {
    try {
      return SafeMath.toBig(base).pow(exponent);
    } catch (error) {
      console.error("SafeMath.power error:", error);
      return new Big(0);
    }
  }

  /**
   * Safe modulo operation
   * @param a Dividend
   * @param b Divisor
   * @returns Result of a % b
   */
  static modulo(a: BigInput, b: BigInput): Big {
    try {
      const divisor = SafeMath.toBig(b);
      if (divisor.eq(0)) {
        console.error("SafeMath.modulo: Division by zero");
        return new Big(0);
      }
      return SafeMath.toBig(a).mod(divisor);
    } catch (error) {
      console.error("SafeMath.modulo error:", error);
      return new Big(0);
    }
  }

  /**
   * Compare two numbers
   * @param a First number
   * @param b Second number
   * @returns -1 if a < b, 0 if a = b, 1 if a > b
   */
  static compare(a: BigInput, b: BigInput): number {
    try {
      return SafeMath.toBig(a).cmp(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.compare error:", error);
      return 0;
    }
  }

  /**
   * Check if two numbers are equal
   */
  static equals(a: BigInput, b: BigInput): boolean {
    try {
      return SafeMath.toBig(a).eq(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.equals error:", error);
      return false;
    }
  }

  /**
   * Check if a > b
   */
  static greaterThan(a: BigInput, b: BigInput): boolean {
    try {
      return SafeMath.toBig(a).gt(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.greaterThan error:", error);
      return false;
    }
  }

  /**
   * Check if a >= b
   */
  static greaterThanOrEqual(a: BigInput, b: BigInput): boolean {
    try {
      return SafeMath.toBig(a).gte(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.greaterThanOrEqual error:", error);
      return false;
    }
  }

  /**
   * Check if a < b
   */
  static lessThan(a: BigInput, b: BigInput): boolean {
    try {
      return SafeMath.toBig(a).lt(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.lessThan error:", error);
      return false;
    }
  }

  /**
   * Check if a <= b
   */
  static lessThanOrEqual(a: BigInput, b: BigInput): boolean {
    try {
      return SafeMath.toBig(a).lte(SafeMath.toBig(b));
    } catch (error) {
      console.error("SafeMath.lessThanOrEqual error:", error);
      return false;
    }
  }

  /**
   * Get absolute value
   */
  static abs(a: BigInput): Big {
    try {
      return SafeMath.toBig(a).abs();
    } catch (error) {
      console.error("SafeMath.abs error:", error);
      return new Big(0);
    }
  }

  /**
   * Round to specified decimal places
   */
  static round(a: BigInput, decimalPlaces = 0): Big {
    try {
      return SafeMath.toBig(a).round(decimalPlaces);
    } catch (error) {
      console.error("SafeMath.round error:", error);
      return new Big(0);
    }
  }

  /**
   * Get minimum of two numbers
   */
  static min(a: BigInput, b: BigInput): Big {
    try {
      const bigA = SafeMath.toBig(a);
      const bigB = SafeMath.toBig(b);
      return bigA.lt(bigB) ? bigA : bigB;
    } catch (error) {
      console.error("SafeMath.min error:", error);
      return new Big(0);
    }
  }

  /**
   * Get maximum of two numbers
   */
  static max(a: BigInput, b: BigInput): Big {
    try {
      const bigA = SafeMath.toBig(a);
      const bigB = SafeMath.toBig(b);
      return bigA.gt(bigB) ? bigA : bigB;
    } catch (error) {
      console.error("SafeMath.max error:", error);
      return new Big(0);
    }
  }

  /**
   * Convert to string with specified decimal places
   */
  static toString(a: BigInput, decimalPlaces?: number): string {
    try {
      const big = SafeMath.toBig(a);
      return decimalPlaces !== undefined
        ? big.toFixed(decimalPlaces)
        : big.toString();
    } catch (error) {
      console.error("SafeMath.toString error:", error);
      return "0";
    }
  }

  /**
   * Convert to number (use with caution for large numbers)
   */
  static toNumber(a: BigInput): number {
    try {
      return Number(SafeMath.toBig(a).toString());
    } catch (error) {
      console.error("SafeMath.toNumber error:", error);
      return 0;
    }
  }

  /**
   * Calculate percentage
   * @param value The value
   * @param total The total
   * @returns Percentage (0-100)
   */
  static percentage(value: BigInput, total: BigInput): Big {
    try {
      const totalBig = SafeMath.toBig(total);
      if (totalBig.eq(0)) return new Big(0);
      return SafeMath.multiply(SafeMath.divide(value, total), 100);
    } catch (error) {
      console.error("SafeMath.percentage error:", error);
      return new Big(0);
    }
  }

  /**
   * Calculate compound interest
   * @param principal Initial amount
   * @param rate Interest rate (as decimal, e.g., 0.05 for 5%)
   * @param periods Number of compounding periods
   * @returns Final amount after compound interest
   */
  static compoundInterest(
    principal: BigInput,
    rate: BigInput,
    periods: number
  ): Big {
    try {
      const onePlusRate = SafeMath.add(1, rate);
      const compoundFactor = SafeMath.power(onePlusRate, periods);
      return SafeMath.multiply(principal, compoundFactor);
    } catch (error) {
      console.error("SafeMath.compoundInterest error:", error);
      return new Big(0);
    }
  }
}
