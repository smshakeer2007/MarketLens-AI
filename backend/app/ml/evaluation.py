import numpy as np
from typing import Dict, Any

class ModelEvaluator:
    """Calculates time-series evaluation metrics and honest baseline comparison."""

    @staticmethod
    def evaluate(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        y_prev: np.ndarray
    ) -> Dict[str, Any]:
        """
        Calculates MAE, RMSE, MAPE, Directional Accuracy, and compares against naive baseline (y_prev).
        """
        y_true = np.asarray(y_true, dtype=float)
        y_pred = np.asarray(y_pred, dtype=float)
        y_prev = np.asarray(y_prev, dtype=float)

        if len(y_true) == 0:
            return {
                "mae": 0.0,
                "rmse": 0.0,
                "mape": 0.0,
                "directional_accuracy_pct": 50.0,
                "naive_rmse": 0.0,
                "beats_baseline": False,
                "reliability_rating": "Insufficient Data",
                "reliability_description": "Not enough validation samples to assess model reliability."
            }

        # 1. Standard Regression Metrics
        errors = y_true - y_pred
        mae = float(np.mean(np.abs(errors)))
        rmse = float(np.sqrt(np.mean(errors ** 2)))
        
        # MAPE with non-zero guard
        non_zero = y_true != 0
        if np.any(non_zero):
            mape = float(np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100.0)
        else:
            mape = 0.0

        # 2. Naive Baseline (Tomorrow = Today)
        naive_errors = y_true - y_prev
        naive_rmse = float(np.sqrt(np.mean(naive_errors ** 2)))

        # 3. Directional Accuracy (% times forecasted direction of change matches actual)
        actual_direction = np.sign(y_true - y_prev)
        pred_direction = np.sign(y_pred - y_prev)
        directional_matches = actual_direction == pred_direction
        dir_acc = float(np.mean(directional_matches) * 100.0)

        # 4. Beats Baseline Determination
        beats_baseline = rmse < naive_rmse

        if beats_baseline and dir_acc >= 55.0:
            rating = "High Reliability"
            description = (
                f"Model beats naive baseline (RMSE ${rmse:.2f} vs ${naive_rmse:.2f}) "
                f"and achieved {dir_acc:.1f}% directional accuracy in walk-forward testing."
            )
        elif beats_baseline:
            rating = "Moderate Reliability"
            description = (
                f"Model marginally outperforms naive baseline (RMSE ${rmse:.2f} vs ${naive_rmse:.2f}) "
                f"with {dir_acc:.1f}% directional accuracy."
            )
        else:
            rating = "Underperforming Baseline"
            description = (
                f"Caution: Model does NOT outperform naive persistence (RMSE ${rmse:.2f} vs Naive ${naive_rmse:.2f}). "
                "Financial price movements resemble a random walk; treat this forecast with high skepticism."
            )

        return {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "directional_accuracy_pct": round(dir_acc, 1),
            "naive_rmse": round(naive_rmse, 2),
            "beats_baseline": beats_baseline,
            "reliability_rating": rating,
            "reliability_description": description
        }

