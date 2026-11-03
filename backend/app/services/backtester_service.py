import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.app.services.data_service import data_service
from backend.app.services.indicator_service import IndicatorService

class BacktesterService:
    """
    Backtesting engine simulating trading strategies based on MarketLens AI Signal Score
    and technical rules vs Buy & Hold benchmark. Zero lookahead bias.
    """

    @staticmethod
    def _calculate_rolling_scores(enriched_df: pd.DataFrame) -> pd.Series:
        """
        Computes rolling Signal Score (-100 to +100) across all historical bars
        without lookahead bias.
        """
        n = len(enriched_df)
        scores = np.zeros(n, dtype=float)

        close = enriched_df["Close"].values
        sma20 = enriched_df["SMA_20"].values if "SMA_20" in enriched_df else close
        sma50 = enriched_df["SMA_50"].values if "SMA_50" in enriched_df else close
        sma200 = enriched_df["SMA_200"].values if "SMA_200" in enriched_df else close

        rsi = enriched_df["RSI_14"].values if "RSI_14" in enriched_df else np.full(n, 50.0)
        macd = enriched_df["MACD"].values if "MACD" in enriched_df else np.zeros(n)
        macd_signal = enriched_df["MACD_Signal"].values if "MACD_Signal" in enriched_df else np.zeros(n)
        macd_hist = enriched_df["MACD_Hist"].values if "MACD_Hist" in enriched_df else np.zeros(n)

        adx = enriched_df["ADX"].values if "ADX" in enriched_df else np.full(n, 20.0)
        slope = enriched_df["Linear_Slope_Pct"].values if "Linear_Slope_Pct" in enriched_df else np.zeros(n)
        bb_b = enriched_df["BB_Percent_B"].values if "BB_Percent_B" in enriched_df else np.full(n, 0.5)

        for i in range(n):
            score = 0.0

            # 1. Moving Averages (±25)
            if not np.isnan(sma20[i]):
                score += 7.0 if close[i] > sma20[i] else -7.0
            if not np.isnan(sma50[i]):
                score += 8.0 if close[i] > sma50[i] else -8.0
            if not np.isnan(sma200[i]):
                score += 10.0 if close[i] > sma200[i] else -10.0
            elif not np.isnan(sma50[i]):
                # If 200 SMA not yet populated, scale up SMA 50
                score += 10.0 if close[i] > sma50[i] else -10.0

            # 2. RSI (±20)
            cur_rsi = rsi[i]
            if not np.isnan(cur_rsi):
                if cur_rsi >= 70:
                    score -= 10.0
                elif cur_rsi <= 30:
                    score += 10.0
                elif 50 <= cur_rsi < 70:
                    score += 15.0 + ((cur_rsi - 50.0) / 20.0) * 5.0
                else:
                    score += -15.0 + ((cur_rsi - 30.0) / 20.0) * 5.0

            # 3. MACD (±20)
            if not np.isnan(macd[i]) and not np.isnan(macd_signal[i]):
                score += 12.0 if macd[i] > macd_signal[i] else -12.0
            if not np.isnan(macd_hist[i]):
                score += 8.0 if macd_hist[i] > 0 else -8.0

            # 4. Trend Strength & Direction (±15)
            cur_slope = slope[i] if not np.isnan(slope[i]) else 0.0
            score += 7.5 if cur_slope > 0 else -7.5
            cur_adx = adx[i] if not np.isnan(adx[i]) else 20.0
            if cur_adx >= 25:
                score += 7.5 if cur_slope > 0 else -7.5

            # 5. Bollinger Bands (±10)
            cur_b = bb_b[i] if not np.isnan(bb_b[i]) else 0.5
            if cur_b < 0.1:
                score += 10.0
            elif cur_b > 0.9:
                score -= 10.0
            elif cur_b >= 0.5:
                score += 5.0
            else:
                score -= 5.0

            # 6. Basic Candlestick pattern proxy (±10)
            if i >= 1:
                o1, c1, h1, l1 = enriched_df["Open"].iloc[i], enriched_df["Close"].iloc[i], enriched_df["High"].iloc[i], enriched_df["Low"].iloc[i]
                rng = h1 - l1
                body = abs(c1 - o1)
                if rng > 0:
                    # Hammer proxy
                    if (min(o1, c1) - l1) >= 2.0 * body and (h1 - max(o1, c1)) <= 0.2 * body and body > 0:
                        score += 10.0
                    # Bullish Engulfing proxy
                    elif i >= 1 and enriched_df["Close"].iloc[i-1] < enriched_df["Open"].iloc[i-1] and c1 > o1 and c1 >= enriched_df["Open"].iloc[i-1]:
                        score += 10.0
                    # Bearish Engulfing proxy
                    elif i >= 1 and enriched_df["Close"].iloc[i-1] > enriched_df["Open"].iloc[i-1] and c1 < o1 and c1 <= enriched_df["Open"].iloc[i-1]:
                        score -= 10.0

            scores[i] = max(-100.0, min(100.0, score))

        return pd.Series(scores, index=enriched_df.index)

    async def run_backtest(
        self,
        ticker: str,
        strategy: str = "signal_score",
        range_val: str = "2y",
        initial_capital: float = 10000.0,
        buy_threshold: float = 20.0,
        sell_threshold: float = -10.0,
        commission_pct: float = 0.001
    ) -> Dict[str, Any]:
        """
        Executes backtest comparing Signal Score strategy to Buy and Hold.
        """
        clean_ticker = ticker.strip().upper()
        df = await data_service.get_history_df(clean_ticker, range_val=range_val, interval="1d")
        if len(df) < 40:
            raise ValueError(f"Insufficient historical bars ({len(df)}) for backtesting ticker {clean_ticker}.")

        enriched = IndicatorService.compute_all_indicators(df)
        enriched["Signal_Score"] = self._calculate_rolling_scores(enriched)

        # Warm-up period: 30 bars to allow indicators to stabilize
        warmup = min(35, len(enriched) // 4)
        sim_df = enriched.iloc[warmup:].copy().reset_index(drop=True)

        # Initialize tracking
        cash = initial_capital
        shares = 0.0
        in_trade = False
        entry_price = 0.0
        entry_date = ""
        entry_idx = 0
        trades: List[Dict[str, Any]] = []
        equity_curve: List[Dict[str, Any]] = []

        # Buy and Hold initialization
        bh_start_close = float(sim_df["Close"].iloc[0])
        bh_shares = (initial_capital * (1.0 - commission_pct)) / bh_start_close

        for i in range(len(sim_df)):
            curr = sim_df.iloc[i]
            date_str = curr["Date"].strftime("%Y-%m-%d") if hasattr(curr["Date"], "strftime") else str(curr["Date"])
            close_price = float(curr["Close"])
            score = float(curr["Signal_Score"])
            is_last_day = (i == len(sim_df) - 1)

            # Signal evaluation:
            if strategy == "sma_cross":
                # Alternative strategy: SMA 20 crosses SMA 50
                s20 = float(curr["SMA_20"]) if "SMA_20" in curr and not np.isnan(curr["SMA_20"]) else close_price
                s50 = float(curr["SMA_50"]) if "SMA_50" in curr and not np.isnan(curr["SMA_50"]) else close_price
                buy_cond = s20 > s50
                sell_cond = s20 < s50
            else:
                # Default: Transparent Signal Score
                buy_cond = score >= buy_threshold
                sell_cond = score <= sell_threshold

            # Trading logic:
            if not in_trade:
                if buy_cond and not is_last_day:
                    # Enter long position
                    effective_capital = cash * (1.0 - commission_pct)
                    shares = effective_capital / close_price
                    cash = 0.0
                    in_trade = True
                    entry_price = close_price
                    entry_date = date_str
                    entry_idx = i
            else:
                # In trade - evaluate exit
                if sell_cond or is_last_day:
                    # Exit long position
                    proceeds = shares * close_price * (1.0 - commission_pct)
                    cost_basis = shares * entry_price
                    pnl = proceeds - cost_basis
                    ret_pct = ((close_price / entry_price) - 1.0) * 100.0 - (commission_pct * 200.0)
                    holding_days = i - entry_idx

                    exit_reason = "Signal Exit" if sell_cond else "End of Backtest"

                    trades.append({
                        "trade_num": len(trades) + 1,
                        "entry_date": entry_date,
                        "exit_date": date_str,
                        "entry_price": round(entry_price, 2),
                        "exit_price": round(close_price, 2),
                        "shares": round(shares, 4),
                        "pnl": round(pnl, 2),
                        "return_pct": round(ret_pct, 2),
                        "holding_days": holding_days,
                        "exit_reason": exit_reason
                    })

                    cash = proceeds
                    shares = 0.0
                    in_trade = False

            # Daily portfolio valuation
            current_strat_value = cash + (shares * close_price)
            current_bh_value = bh_shares * close_price

            equity_curve.append({
                "date": date_str,
                "strategy_equity": round(current_strat_value, 2),
                "buy_and_hold_equity": round(current_bh_value, 2),
                "close": round(close_price, 2),
                "signal_score": round(score, 1),
                "in_position": in_trade
            })

        # Summary performance metrics
        final_strat_equity = equity_curve[-1]["strategy_equity"]
        final_bh_equity = equity_curve[-1]["buy_and_hold_equity"]

        strat_return = ((final_strat_equity / initial_capital) - 1.0) * 100.0
        bh_return = ((final_bh_equity / initial_capital) - 1.0) * 100.0

        n_days = len(equity_curve)
        years = max(n_days / 252.0, 0.1)

        strat_cagr = (((final_strat_equity / initial_capital) ** (1.0 / years)) - 1.0) * 100.0 if final_strat_equity > 0 else -100.0
        bh_cagr = (((final_bh_equity / initial_capital) ** (1.0 / years)) - 1.0) * 100.0 if final_bh_equity > 0 else -100.0

        # Drawdown and Volatility calculations
        strat_eq_arr = np.array([pt["strategy_equity"] for pt in equity_curve])
        bh_eq_arr = np.array([pt["buy_and_hold_equity"] for pt in equity_curve])

        strat_cummax = np.maximum.accumulate(strat_eq_arr)
        strat_drawdowns = (strat_eq_arr - strat_cummax) / strat_cummax
        strat_max_dd = float(np.min(strat_drawdowns) * 100.0)

        bh_cummax = np.maximum.accumulate(bh_eq_arr)
        bh_drawdowns = (bh_eq_arr - bh_cummax) / bh_cummax
        bh_max_dd = float(np.min(bh_drawdowns) * 100.0)

        # Volatility & Sharpe (Risk-free = 4.5%)
        strat_returns = pd.Series(strat_eq_arr).pct_change().dropna()
        strat_ann_vol = float(strat_returns.std() * np.sqrt(252) * 100.0) if len(strat_returns) > 1 else 0.0

        bh_returns = pd.Series(bh_eq_arr).pct_change().dropna()
        bh_ann_vol = float(bh_returns.std() * np.sqrt(252) * 100.0) if len(bh_returns) > 1 else 0.0

        strat_sharpe = round((strat_cagr - 4.5) / strat_ann_vol, 2) if strat_ann_vol > 0 else 0.0
        bh_sharpe = round((bh_cagr - 4.5) / bh_ann_vol, 2) if bh_ann_vol > 0 else 0.0

        # Trade metrics
        total_trades = len(trades)
        winning_trades = sum(1 for t in trades if t["pnl"] > 0)
        losing_trades = sum(1 for t in trades if t["pnl"] <= 0)
        win_rate = round((winning_trades / total_trades * 100.0), 2) if total_trades > 0 else 0.0

        gross_profit = sum(t["pnl"] for t in trades if t["pnl"] > 0)
        gross_loss = abs(sum(t["pnl"] for t in trades if t["pnl"] < 0))
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (99.0 if gross_profit > 0 else 1.0)

        avg_trade_return = round(sum(t["return_pct"] for t in trades) / total_trades, 2) if total_trades > 0 else 0.0

        summary = {
            "initial_capital": round(initial_capital, 2),
            "final_strategy_value": round(final_strat_equity, 2),
            "final_buy_and_hold_value": round(final_bh_equity, 2),
            "strategy_return_pct": round(strat_return, 2),
            "buy_and_hold_return_pct": round(bh_return, 2),
            "strategy_cagr_pct": round(strat_cagr, 2),
            "buy_and_hold_cagr_pct": round(bh_cagr, 2),
            "strategy_max_drawdown_pct": round(strat_max_dd, 2),
            "buy_and_hold_max_drawdown_pct": round(bh_max_dd, 2),
            "strategy_sharpe_ratio": strat_sharpe,
            "buy_and_hold_sharpe_ratio": bh_sharpe,
            "strategy_annualized_volatility_pct": round(strat_ann_vol, 2),
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate_pct": win_rate,
            "profit_factor": profit_factor,
            "avg_trade_return_pct": avg_trade_return
        }

        return {
            "ticker": clean_ticker,
            "strategy": strategy,
            "range": range_val,
            "summary": summary,
            "equity_curve": equity_curve,
            "trades": trades
        }

backtester_service = BacktesterService()
