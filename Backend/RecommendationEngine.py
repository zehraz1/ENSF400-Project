from typing import Any, Dict, List


class RecommendationEngine:
    """
    This class is responsible for:
    - Generating a simple recommendation message
    - Combining stock summary, risk result, and user inputs
    - Returning structured recommendation output for the frontend
    """

    def __init__(self):
        pass

    def _normalize_risk(self, value: str) -> str:
        """
        Normalize a risk string to lowercase and provide a safe default.
        """
        if not value:
            return "unknown"
        return str(value).strip().lower()

    def _get_position_comment(self, position_percentage: float) -> str:
        """
        Explain in simple terms how much of the portfolio is in this stock.
        """
        if position_percentage >= 50:
            return "A big part of your portfolio is in this one stock, so there is more risk if the price drops."
        if position_percentage >= 25:
            return "A noticeable part of your portfolio is in this stock, so it is worth checking carefully."
        if position_percentage > 0:
            return "Only a smaller part of your portfolio is in this stock."
        return "This stock does not take up much of your portfolio right now."

    def _choose_recommendation_label(
        self,
        adjusted_risk: str,
        user_risk: str,
        position_percentage: float,
    ) -> str:
        """
        Choose a simple recommendation label based on:
        - final adjusted risk
        - user's risk tolerance
        - position size
        """
        adjusted_risk = self._normalize_risk(adjusted_risk)
        user_risk = self._normalize_risk(user_risk)

        if adjusted_risk == "high" and position_percentage >= 25:
            return "Be Careful"

        if adjusted_risk == "high" and user_risk == "low":
            return "Be Careful"

        if adjusted_risk == "medium":
            return "Take a Closer Look"

        if adjusted_risk == "low":
            return "Looks Reasonable"

        return "Not Enough Information"

    def _build_recommendation_message(
        self,
        label: str,
        adjusted_risk: str,
        market_risk: str,
        user_risk: str,
        position_percentage: float,
        summary: str,
        pros: List[str],
        cons: List[str],
    ) -> str:
        """
        Build the final recommendation paragraph in plain language.
        """
        position_comment = self._get_position_comment(position_percentage)

        pros_text = ", ".join(pros[:2]) if pros else "there are no clear positives yet"
        cons_text = ", ".join(cons[:2]) if cons else "there are no clear concerns yet"

        if label == "Be Careful":
            return (
                f"This stock may be riskier than what you are comfortable with. "
                f"{position_comment} "
                f"Some good signs are: {pros_text}. "
                f"Things to watch out for are: {cons_text}. "
                f"Overall: {summary}"
            )

        if label == "Take a Closer Look":
            return (
                f"This stock may be worth looking into more before making a decision. "
                f"{position_comment} "
                f"Some good signs are: {pros_text}. "
                f"Some possible concerns are: {cons_text}. "
                f"Overall: {summary}"
            )

        if label == "Looks Reasonable":
            return (
                f"This stock seems to match your selected risk level fairly well. "
                f"{position_comment} "
                f"Some good signs are: {pros_text}. "
                f"Some possible concerns are: {cons_text}. "
                f"Overall: {summary}"
            )

        return (
            f"There is not enough information right now to give a clear recommendation. "
            f"{position_comment} "
            f"Overall: {summary}"
        )

    def _build_confidence_note(
        self,
        summary_error: Any,
        adjusted_risk: str,
        pros: List[str],
        cons: List[str],
    ) -> str:
        """
        Create a simple note about how reliable the output is.
        """
        if summary_error:
            return "This result may be less reliable because the AI summary did not fully work."

        if self._normalize_risk(adjusted_risk) == "unknown":
            return "This result may be less reliable because the system could not clearly measure the risk."

        if not pros or not cons:
            return "This result is somewhat reliable, but some details are missing."

        return "This result is based on recent stock data, news, and AI-generated analysis."

    def generate_recommendation(
        self,
        llm_result: Dict[str, Any],
        risk_result: Dict[str, Any],
        invested_amount: float,
        portfolio_size: float,
        user_risk: str,
    ) -> Dict[str, Any]:
        """
        Main public method for generating recommendation output.
        """
        summary = llm_result.get("summary", "No summary available.")
        pros = llm_result.get("pros", [])
        cons = llm_result.get("cons", [])
        summary_error = llm_result.get("error")

        adjusted_risk = risk_result.get("adjustedRisk", "Unknown")
        market_risk = risk_result.get("marketRisk", "Unknown")
        position_percentage = float(risk_result.get("positionPercentage", 0.0))

        label = self._choose_recommendation_label(
            adjusted_risk=adjusted_risk,
            user_risk=user_risk,
            position_percentage=position_percentage,
        )

        message = self._build_recommendation_message(
            label=label,
            adjusted_risk=adjusted_risk,
            market_risk=market_risk,
            user_risk=user_risk,
            position_percentage=position_percentage,
            summary=summary,
            pros=pros,
            cons=cons,
        )

        confidence_note = self._build_confidence_note(
            summary_error=summary_error,
            adjusted_risk=adjusted_risk,
            pros=pros,
            cons=cons,
        )

        return {
            "label": label,
            "message": message,
            "confidenceNote": confidence_note,
            "investedAmount": invested_amount,
            "portfolioSize": portfolio_size,
            "userRiskTolerance": user_risk,
            "pros": pros,
            "cons": cons, 
        }