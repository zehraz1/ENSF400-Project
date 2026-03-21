from StockDataCollector import yf_aggregator
from functools import lru_cache
import time
from flask import jsonify
import yfinance as yf


@lru_cache(maxsize=128)
def search_ticker_cache(query, ttl_hash=None):
    try:
        results = yf.Search(query, max_results=5)
        quotes = results.quotes or []
        suggestions = [
                {"ticker": q.get("symbol"), "name": q.get("longname") or q.get("shortname")}
                for q in quotes
                if q.get("symbol")
                ]
        return jsonify(suggestions)
    except Exception:
        return jsonify([])


@lru_cache(maxsize=32)
def convert_currency_cache(from_currency, to_currency, ttl_hash=None):
    if from_currency == to_currency:
        return jsonify({"rate": 1.0})
    try:
        pair = f"{from_currency}{to_currency}=X"
        ticker = yf.Ticker(pair)
        rate = ticker.fast_info.get("lastPrice")
        return jsonify({"rate": rate})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@lru_cache(maxsize=32)
def get_price_cache(ticker, ttl_hash=None):
    agg = yf_aggregator(ticker)
    if not agg.is_valid_ticker():
        return jsonify({"error": "invalid ticker"}), 404

    try:
        info = agg._get_company_info()
        return jsonify({
            "ticker": ticker,
            "price": info.get("currentPrice"),
            "currency": info.get("currency"),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@lru_cache(maxsize=32)
def get_stock_info_cache(ticker, ttl_hash=None):
    stock = yf_aggregator(ticker)

    if not stock.is_valid_ticker():
        return jsonify({"error": "invalid ticker"}), 400

    try:
        news = stock.get_news_data()
        company_name = stock.get_company_info()["shortName"]
        stock_history = stock.get_price_history()

        return jsonify({"company_name": company_name, \
                "stock_history": stock_history, "news": news})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@lru_cache(maxsize=32)
def get_advice_cache(ticker, ttl_hash=None):
    # this will change with the implementation of the LLM

    # return {"summary": string, "advice": string}
    pass


def get_ttl_hash(seconds=86400) -> int: # default ttl to one day
    """
    Get a hash value for the time to live. Rather than reset the cache 
    after TTL has expired, just reload the values every n seconds. This
    time will depend on how long the stock_history we expect to collect
    @Param seconds: the ttl in seconds
    """
    return round(time.time() / seconds)
