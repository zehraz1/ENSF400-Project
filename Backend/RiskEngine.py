from typing import Dict, Any


class RiskEngine:
    """
    This class is responsible for:
    - Calculating position size (how much of portfolio is invested)
    - Classifying stock risk level (Low / Medium / High)
    - Combining market data with user risk tolerance
    """

    def __init__(self):
        pass

    def calculate_position_percentage(self, invested_amount: float, portfolio_size: float) -> float:
        """
        Calculate how much of the portfolio is invested in this stock.

        Example:
        invested = 1000
        portfolio = 5000
        → 20%
        """
        try:
            if portfolio_size <= 0:
                return 0.0

            percentage = (invested_amount / portfolio_size) * 100
            return round(percentage, 2)

        except Exception:
            return 0.0

    def classify_volatility(self, volatility: float) -> str:
        """
        Convert volatility into a risk category.

        Typical interpretation:
        < 1% → Low
        1% - 3% → Medium
        > 3% → High
        """
        if volatility is None:
            return "Unknown"

        if volatility < 0.01:
            return "Low"
        elif volatility < 0.03:
            return "Medium"
        else:
            return "High"

    def adjust_for_user_risk(self, market_risk: str, user_risk: str) -> str:
        """
        Adjust the final risk level based on user risk tolerance.

        Example:
        - High volatility + Low tolerance → High risk
        - Medium volatility + High tolerance → Medium or Low
        """
        if market_risk == "Unknown":
            return "Unknown"

        # Normalize inputs
        user_risk = (user_risk or "").lower()
        market_risk = market_risk.lower()

        # Define ranking
        levels = {"low": 1, "medium": 2, "high": 3}

        market_level = levels.get(market_risk, 2)
        user_level = levels.get(user_risk, 2)

        # If stock is riskier than user tolerance → keep higher risk
        if market_level > user_level:
            return "High"

        # If user tolerance is higher → reduce perceived risk slightly
        if user_level > market_level:
            return "Low"

        return market_risk.capitalize()

    def evaluate(
        self,
        risk_metrics: Dict[str, Any],
        invested_amount: float,
        portfolio_size: float,
        user_risk: str,
    ) -> Dict[str, Any]:
        """
        Main method that combines everything into a final risk assessment.
        """

        volatility = risk_metrics.get("volatility")
        beta = risk_metrics.get("beta")

        # Step 1: classify volatility
        market_risk = self.classify_volatility(volatility)

        # Step 2: adjust based on user tolerance
        adjusted_risk = self.adjust_for_user_risk(market_risk, user_risk)

        # Step 3: calculate position size
        position_percentage = self.calculate_position_percentage(
            invested_amount, portfolio_size
        )

        return {
            "volatility": volatility,
            "beta": beta,
            "marketRisk": market_risk,
            "adjustedRisk": adjusted_risk,
            "positionPercentage": position_percentage,
        }