import yfinance as yf


class yf_aggregator:
    def __init__(self, ticker: str):
        self.t = yf.Ticker(ticker)

    def is_valid_ticker(self) -> bool:  # Fixed: removed ticker parameter
        try:
            return len(self.t.calendar) > 0
        except Exception:
            return False

    def get_news_data(self) -> list:
        if not self.is_valid_ticker():
            return None

        titles = [newsitem['content']["title"] for newsitem in self.t.news if "title" in newsitem['content'].keys()]
        if len(titles) > 0:
            return titles
        else:
            return None

    def get_fin_data(self) -> dict:
        if not self.is_valid_ticker():
            return None

        data = {}
        data['info'] = self.t.info
        data['calendar'] = self.t.calendar
        data['analyst_price_targets'] = self.t.analyst_price_targets
        data['quarterly_income_stmt'] = self.t.quarterly_income_stmt.to_dict()
        data['history'] = self.t.history(period='1mo').to_dict()
        data['option_chain'] = self.t.option_chain(self.t.options[0]).calls.to_dict()

        return data

    def get_risk_metrics(self) -> dict:
        """
        Compute simple risk metrics:
        - Volatility (standard deviation of returns)
        - Average daily return
        - Beta (IF available)
        """
        if not self.is_valid_ticker():
            return {
                "volatility": None,
                "beta": None,
                "averageDailyReturn": None,
            }

        try:
            history = self.t.history(period="1mo", auto_adjust=False)

            if history is None or history.empty or "Close" not in history:
                return {
                    "volatility": None,
                    "beta": None,
                    "averageDailyReturn": None,
                }

            closes = history["Close"].dropna()
            returns = closes.pct_change().dropna()

            volatility = float(returns.std()) if not returns.empty else None
            average_daily_return = float(returns.mean()) if not returns.empty else None

            # Try to get beta from company info
            try:
                info = self.t.info or {}
            except Exception:
                info = {}

            beta = info.get("beta")

            return {
                "volatility": volatility,
                "beta": beta,
                "averageDailyReturn": average_daily_return,
            }

        except Exception:
            return {
                "volatility": None,
                "beta": None,
                "averageDailyReturn": None,
            }