/**
 * Extensible multi-exchange service layer
 *
 * Defines a common interface for fetching user position data from perpetual
 * exchanges. Adding support for a new exchange only requires implementing
 * ExchangeServiceAdapter and registering it in EXCHANGE_ADAPTERS.
 */

import { fetchAsterPositions } from './aster';

// ---------------------------------------------------------------------------
// Common types
// ---------------------------------------------------------------------------

export interface UserPosition {
  id: string;
  symbol: string;
  baseAsset: string;
  side: 'Long' | 'Short';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  leverage: number;
  exchange: string;
}

// ---------------------------------------------------------------------------
// Adapter interface
// ---------------------------------------------------------------------------

export interface ExchangeServiceAdapter {
  readonly exchangeName: string;
  fetchUserPositions(address: string): Promise<UserPosition[]>;
}

// ---------------------------------------------------------------------------
// Aster adapter
// ---------------------------------------------------------------------------

export const asterServiceAdapter: ExchangeServiceAdapter = {
  exchangeName: 'Aster',

  async fetchUserPositions(address: string): Promise<UserPosition[]> {
    const raw = await fetchAsterPositions(address);

    return raw
      .filter((p) => parseFloat(p.positionAmt) !== 0)
      .map((p, idx) => {
        const posAmt = parseFloat(p.positionAmt);
        const entry = parseFloat(p.entryPrice);
        const mark = parseFloat(p.markPrice);
        const liq = parseFloat(p.liquidationPrice);
        const pnl = parseFloat(p.unRealizedProfit);
        const lev = parseFloat(p.leverage);
        const notional = Math.abs(posAmt) * entry;
        const pnlPct = notional > 0 ? (pnl / notional) * 100 : 0;
        const side: 'Long' | 'Short' =
          p.positionSide === 'SHORT' || (p.positionSide === 'BOTH' && posAmt < 0)
            ? 'Short'
            : 'Long';
        // Aster currently lists USDT-quoted perpetuals; strip the quote suffix to get the base asset.
        const baseAsset = p.symbol.replace(/USDT$/, '');

        return {
          id: `aster-${p.symbol}-${idx}`,
          symbol: `${baseAsset}-USD`,
          baseAsset,
          side,
          size: Math.abs(posAmt),
          entryPrice: entry,
          markPrice: mark,
          liquidationPrice: liq,
          unrealizedPnl: pnl,
          unrealizedPnlPercent: pnlPct,
          leverage: lev,
          exchange: 'Aster',
        };
      });
  },
};

// ---------------------------------------------------------------------------
// Registry – add new adapters here to extend the service layer
// ---------------------------------------------------------------------------

export const EXCHANGE_ADAPTERS: Record<string, ExchangeServiceAdapter> = {
  aster: asterServiceAdapter,
};
