import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from backend.app.services.data_service import data_service
from backend.app.services.indicator_service import IndicatorService
from backend.app.services.trend_service import TrendService

class PortfolioService:
    """Quantitative risk metrics, multi-asset normalized performance, and correlation engine."""

    @staticmethod
    def calculate_risk_metrics(
        stock_df: pd.DataFrame,
        benchmark_df: Optional[pd.DataFrame] = None,
        risk_free_rate: float = 0.045
    ) -> Dict[str, Any]:
        """
        Calculates Annualized Volatility, Max Drawdown, Sharpe Ratio, Beta, and Historical VaR.
        """
        close = stock_df["Close"].astype(float)
        if len(close) < 10:
            return {}

        daily_returns = close.pct_change().dropna()
        log_returns = np.log(close / close.shift(1)).dropna()

        # 1. Annualized Volatility
        ann_vol = float(log_returns.std() * np.sqrt(252) * 100.0)

        # 2. Maximum Drawdown (MDD)
        rolling_max = close.cummax()
        drawdowns = (close - rolling_max) / rolling_max
        max_drawdown = float(drawdowns.min() * 100.0)

        # 3. Sharpe Ratio
        mean_annual_return = float(daily_returns.mean() * 252)
        ann_vol_dec = ann_vol / 100.0
        sharpe_ratio = float((mean_annual_return - risk_free_rate) / ann_vol_dec) if ann_vol_dec > 0 else 0.0

        # 4. Beta vs Benchmark
        beta = 1.0
        if benchmark_df is not None and len(benchmark_df) >= 10:
            # Align timestamps
            merged = pd.merge(
                stock_df[["Date", "Close"]].rename(columns={"Close": "stock"}),
                benchmark_df[["Date", "Close"]].rename(columns={"Close": "bench"}),
                on="Date"
            ).dropna()
            if len(merged) > 10:
                s_ret = merged["stock"].pct_change().dropna()
                b_ret = merged["bench"].pct_change().dropna()
                cov = np.cov(s_ret, b_ret)[0][1]
                var_b = np.var(b_ret)
                if var_b > 0:
                    beta = float(cov / var_b)

        # 5. Value at Risk (1-day Historical VaR)
        var_95 = float(-np.percentile(daily_returns, 5) * 100.0)
        var_99 = float(-np.percentile(daily_returns, 1) * 100.0)

        # Total Return over period
        total_return = float(((close.iloc[-1] / close.iloc[0]) - 1.0) * 100.0)

        return {
            "total_return_pct": round(total_return, 2),
            "annualized_volatility_pct": round(ann_vol, 2),
            "max_drawdown_pct": round(max_drawdown, 2),
            "sharpe_ratio": round(sharpe_ratio, 2),
            "beta": round(beta, 2),
            "var_95_daily_pct": round(max(var_95, 0.0), 2),
            "var_99_daily_pct": round(max(var_99, 0.0), 2),
        }

    async def compare_stocks(
        self,
        tickers: List[str],
        range_val: str = "1y"
    ) -> Dict[str, Any]:
        """
        Calculates normalized percentage returns, risk comparison, and Pearson correlation matrix
        for 2 to 5 stocks.
        """
        clean_tickers = [t.strip().upper() for t in tickers if t.strip()][:5]
        if len(clean_tickers) < 2:
            raise ValueError("At least 2 tickers are required for comparison.")

        # Determine benchmark: NIFTY if all Indian, else SPY
        is_indian = all(t.endswith(".NS") or t.endswith(".BO") or t.startswith("^") for t in clean_tickers)
        bench_symbol = "^NSEI" if is_indian else "SPY"
        bench_df = None
        try:
            bench_df = await data_service.get_history_df(bench_symbol, range_val=range_val, interval="1d")
        except Exception:
            pass

        dfs = {}
        info_map = {}
        for t in clean_tickers:
            try:
                df = await data_service.get_history_df(t, range_val=range_val, interval="1d")
                inf = await data_service.get_ticker_info(t)
                dfs[t] = df
                info_map[t] = inf
            except Exception as e:
                pass

        if len(dfs) < 2:
            raise ValueError("Could not retrieve sufficient market data for the requested comparison tickers.")

        # 1. Normalized Performance Series (rebased to 0% at start)
        # Find common date intersection
        common_dates = None
        for t, df in dfs.items():
            dates_set = set(df["Date"].dt.strftime("%Y-%m-%d"))
            if common_dates is None:
                common_dates = dates_set
            else:
                common_dates = common_dates.intersection(dates_set)

        sorted_dates = sorted(list(common_dates))
        if len(sorted_dates) < 5:
            # Fallback to outer merge
            sorted_dates = sorted(list(set.union(*[set(df["Date"].dt.strftime("%Y-%m-%d")) for df in dfs.values()])))

        normalized_series = []
        start_prices = {}
        for t, df in dfs.items():
            sub = df[df["Date"].dt.strftime("%Y-%m-%d").isin(sorted_dates)]
            if not sub.empty:
                start_prices[t] = float(sub["Close"].iloc[0])

        for d_str in sorted_dates:
            pt = {"date": d_str}
            for t, df in dfs.items():
                match = df[df["Date"].dt.strftime("%Y-%m-%d") == d_str]
                if not match.empty and t in start_prices and start_prices[t] > 0:
                    c = float(match["Close"].iloc[0])
                    norm_return = ((c - start_prices[t]) / start_prices[t]) * 100.0
                    pt[t] = round(norm_return, 2)
            normalized_series.append(pt)

        # 2. Risk Metrics & Signal Score per Stock
        stock_metrics = []
        returns_dict = {}
        for t, df in dfs.items():
            risk = self.calculate_risk_metrics(df, bench_df)
            snap = IndicatorService.get_summary_snapshot(df)
            pats = TrendService.detect_candlestick_patterns(df)
            sig = TrendService.calculate_signal_score(df, snap, pats)
            inf = info_map.get(t, {})

            stock_metrics.append({
                "ticker": t,
                "name": inf.get("name", t),
                "current_price": inf.get("current_price", snap.get("close", 0)),
                "change_percent": inf.get("change_percent", 0),
                "total_return_pct": risk.get("total_return_pct", 0),
                "annualized_volatility_pct": risk.get("annualized_volatility_pct", 0),
                "sharpe_ratio": risk.get("sharpe_ratio", 0),
                "max_drawdown_pct": risk.get("max_drawdown_pct", 0),
                "beta": risk.get("beta", 1.0),
                "var_95_pct": risk.get("var_95_daily_pct", 0),
                "signal_score": sig.get("score", 0),
                "signal_category": sig.get("category", "Neutral")
            })

            # For correlation calculation
            returns_dict[t] = df.set_index("Date")["Close"].pct_change()

        # 3. Pearson Correlation Heatmap Matrix
        returns_df = pd.DataFrame(returns_dict).dropna()
        corr_matrix = returns_df.corr().round(2).to_dict()

        correlation_data = []
        for t1 in clean_tickers:
            if t1 in corr_matrix:
                for t2 in clean_tickers:
                    if t2 in corr_matrix[t1]:
                        correlation_data.append({
                            "stock_a": t1,
                            "stock_b": t2,
                            "correlation": corr_matrix[t1][t2]
                        })

        return {
            "tickers": clean_tickers,
            "benchmark": bench_symbol,
            "normalized_series": normalized_series,
            "metrics": stock_metrics,
            "correlation_matrix": corr_matrix,
            "correlation_pairs": correlation_data
        }

portfolio_service = PortfolioService()
