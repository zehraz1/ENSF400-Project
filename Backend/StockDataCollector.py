import math
from datetime import datetime
from typing import Any, List, Dict, Optional


import yfinance as yf


class yf_aggregator:
    """
    This class is responsible for:
    - Fetching stock data from Yahoo Finance
    - Converting data into JSON-safe format
    - Retrieving and parsing news
    - Computing basic risk metrics
    """

    def __init__(self, ticker: str):
        # Normalize ticker symbol (e.g., "AAPL" instead of "aapl")
        self.symbol = (ticker or "").strip().upper()

        #Create yfinance Ticker object
        self.t = yf.Ticker(self.symbol)

    def _is_nan(self, value: Any) -> bool:
        """
        Helper method to check if a value is NaN (Not a Number)
        """
        try:
            return isinstance(value, float) and math.isnan(value)
        except Exception:
            return False
        
    def _sanitize_value(self, value: Any) -> Any:
        """
        Convert values from yfinance/pandas/numpy into JSON-safe values. 
        This ensures the backend can safely return JSON responses. 
        """

        # Handle None
        if value is None:
            return None
        # Handle NaN
        if self._is_nan(value):
            return None
        # Primitive types are already safe
        if isinstance(value, (str, int, float, bool)):
            return value
        # Convert datetime to ISO format string
        if isinstance(value, datetime):
            return value.isoformat()
        # Try generic isoformat conversion 
        if hasattr(value, 'isoformat'):
            try:
                return value.isoformat()
            except Exception:
                pass
        # recursively sanitize dictionaries
        if isinstance(value, dict):
            return {str(k): self._sanitize_value(v) for k, v in value.items()} 
        # recursively sanitize lists/tuples
        if isinstance(value, (list, tuple)):
            return [self._sanitize_value(v) for v in value]
        # handle numpy/pandas values
        try: 
            return value.item()  # Convert numpy/pandas scalar to native Python type
        except Exception:
            pass

        
        # Fallback: convert to string
        return str(value) 


    def is_valid_ticker(self) -> bool: 
        """
        Validate ticker by attempting to retrieve recent price history.
        If no data is returned, ticker is likely invalid.
        """    
        if not self.symbol:
            return False
        
        try:
            history = self.t.history(period='5d', auto_adjust=False)
            return history is not None and not history.empty
        except Exception:
            return False
        
    def _get_company_info(self) -> Dict[str, Any]:
        """
        Extract important company info fields. 
        Only selected fields are returned to avaoid excessive data.
        """
        try:
            info = self.t.info or {}
        except Exception:
            info = {}

        # Select only relevant fields for company info
        fields = [
            "symbol", 
            "shortName", 
            "longName", 
            "sector", 
            "industry", 
            "country", 
            "currency",
            "exchange",
            "marketCap",
            "trailingPE",
            "forwardPE",
            "beta",
            "dividendYield",
            "fiftyTwoWeekHigh",
            "fiftyTwoWeekLow",
            "currentPrice",
            "targetMeanPrice",
            "recommendationKey",
            "longBusinessSummary",
        ]

        result = {} 

        # extract and sanitize each field
        for field in fields:
            value = info.get(field)
            result[field] = self._sanitize_value(value)

        return result
    
    def _get_price_history(self, period: str = '1mo') -> List[Dict[str, Any]]:
        """
        Retrieve historical price data and then convert into JSON format
        """
        
        try: 
            history = self.t.history(period=period, auto_adjust=False)

            if history is None or history.empty:
                return []
            
            rows: List[Dict[str, Any]] = []

            # convert each row into a dictionary 
            for index, row in history.iterrows(): 
                row_dict = {
                    "date": index.isoformat() if hasattr(index, 'isoformat') else str(index),
                    "open": self._sanitize_value(row.get("Open")),
                    "high": self._sanitize_value(row.get("High")),
                    "low": self._sanitize_value(row.get("Low")),
                    "close": self._sanitize_value(row.get("Close")),
                    "volume": self._sanitize_value(row.get("Volume")),
                }
                rows.append(row_dict)
            return rows
        
        except Exception: 
            return []

    def _get_analyst_targets(self) -> Dict[str, Any]:
        """ 
        Retrieve analysr price targets.
        """
        try:
            targets = self.t.analyst_price_targets

            if targets is None:
                return {}
            
            if hasattr(targets, 'to_dict'):
                return self._sanitize_value(targets.to_dict())
            
            return self._sanitize_value(targets)
        
        except Exception:
            return {}

    def _get_calendar(self) -> Dict[str, Any]:
        """
        Retrieve upcoming events (earnings dates, and more).
        """
        try:
            cal = self.t.calendar

            if cal is None:
                return {}

            if hasattr(cal, "to_dict"):
                return self._sanitize_value(cal.to_dict())

            return self._sanitize_value(cal)

        except Exception:
            return {}

    def _get_quarterly_income_stmt(self) -> Dict[str, Any]:
        """
        Retrieve quarterly income statement.
        """
        try:
            stmt = self.t.quarterly_income_stmt

            if stmt is None:
                return {}

            if hasattr(stmt, "to_dict"):
                return self._sanitize_value(stmt.to_dict())

            return self._sanitize_value(stmt)

        except Exception:
            return {}

    def _get_option_chain_summary(self) -> Dict[str, Any]:
        """
        Retrieve basic option chain summary (call/put counts).
        """
        try:
            options = self.t.options

            if not options:
                return {}

            # Use the first expiration date
            chain = self.t.option_chain(options[0])

            calls = chain.calls
            puts = chain.puts

            return {
                "expiration": options[0],
                "callCount": int(len(calls)) if calls is not None else 0,
                "putCount": int(len(puts)) if puts is not None else 0,
            }

        except Exception:
            return {}
        
    def get_news_data(self) -> Optional[List[Dict[str, Any]]]:
        """
        Retrieve and parse news data into JSON.
        """
        if not self.is_valid_ticker():
            return None
        
        try:
            raw_news = self.t.news or []
            parsed_news: List[Dict[str, Any]] = []

            for item in raw_news[:10]: # limit to 10 news, subject to change 
                content = item.get('content', {}) if isinstance(item, dict) else {} 

                if not isinstance(content, dict):
                    continue

                title = content.get("title")

                if not title:
                    continue

                parsed_news.append(
                    {
                        "title": self._sanitize_value(title),
                        "publisher": self._sanitize_value(
                            content.get("provider"), {}).get("displayName")
                            if isinstance(content.get("provider"), dict)
                            else None,
                        "summary": self._sanitize_value(content.get("summary")),
                        "link": self._sanitize_value(
                            content.get("canonicalUrl",{}).get("url") 
                            if isinstance(content.get("canonicalUrl"), dict) 
                            else None
                        ),
                        "published": self._sanitize_value(content.get("pubDate")),
                    }    
                )
            return parsed_news if parsed_news else [] 
        
        except Exception:
            return []


    def get_fin_data(self) -> Optional[Dict[str, Any]]:
        """
        Aggregate all financial data into single dictionary. 
        """

        if not self.is_valid_ticker():
            return None
        
        return {
            "ticker": self.symbol,
            "companyInfo": self._get_company_info(),
            "calendar": self._get_calendar(), 
            "analystPriceTargets": self._get_analyst_targets(),
            "quarterlyIncomeStatement": self._get_quarterly_income_stmt(),
            "priceHistory": self._get_price_history(period='1mo'),
            "optionChainSummary": self._get_option_chain_summary(),
        }
    
    def get_risk_metrics(self) -> Dict[str, Any]:
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
                "volatility": self._sanitize_value(volatility),
                "beta": self._sanitize_value(beta),
                "averageDailyReturn": self._sanitize_value(average_daily_return),
            }

        except Exception:
            return {
                "volatility": None,
                "beta": None,
                "averageDailyReturn": None,
            }   
