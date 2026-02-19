/**
 * Common exchange interfaces for normalizing data across multiple exchanges.
 * Designed to be easily extended for new exchanges in the future.
 */

export interface ExchangePosition {
  /** Trading pair, e.g. "ETH-USD" */
  pair: string;
  /** Positive = Long, Negative = Short */
  side: 'Long' | 'Short';
  /** Size in base asset */
  size: number;
  /** Notional value in USD */
  positionValue: number;
  /** Entry price in USD */
  entryPrice: number;
  /** Current mark price in USD */
  markPrice: number;
  /** Liquidation price in USD */
  liquidationPrice: number;
  /** Unrealized PnL in USD */
  unrealizedPnl: number;
  /** Leverage multiplier */
  leverage: number;
  /** Exchange name */
  exchange: string;
}

export interface ExchangeOrder {
  /** Order ID */
  oid: number;
  /** Trading pair, e.g. "ETH" */
  coin: string;
  /** true = buy/long, false = sell/short */
  isBuy: boolean;
  /** Order price in USD */
  limitPx: number;
  /** Remaining size */
  sz: number;
  /** Exchange name */
  exchange: string;
}

/**
 * Interface for exchange services.
 * Implement this interface to add support for a new exchange.
 */
export interface IExchangeService {
  /** Human-readable exchange name */
  readonly name: string;

  /**
   * Fetch open positions for a user.
   * @param address - User's wallet address
   */
  getUserPositions(address: string): Promise<ExchangePosition[]>;

  /**
   * Fetch open orders for a user.
   * @param address - User's wallet address
   */
  getOpenOrders(address: string): Promise<ExchangeOrder[]>;
}
