# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
from StockDataCollector import yf_aggregator
from LLMHandler import generate_summary
from functools import lru_cache
from typing import Any, List, Dict, Optional
import time
import threading

endpoint = Flask(__name__)
CORS(endpoint)

@lru_cache(maxsize=32)
def get_stock_info_cache(ticker, ttl_hash=None) -> Dict[str, Any]:
    stock = yf_aggregator(ticker)

    if not stock.is_valid_ticker():
        return None

    news = stock.get_news_data()
    company_name = stock.get_company_info()["shortName"]
    stock_history = stock.get_price_history()

    # create a temporary thread to cache the get_advice
    # test this to see if it actually helps performance (this will use too many tokens
    #                                                      so ignore for now)
    # temp_thread = threading.Thread(target=get_advice_cache, args=(ticker, ttl_hash))
    # temp_thread.start()

    return {"company_name": company_name, \
            "stock_history": stock_history, "news": news}


@lru_cache(maxsize=32)
def get_advice_cache(ticker, ttl_hash=None) -> Dict[str, Any]:
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


@endpoint.route('/', methods=['POST'])
def get_advice():
    request_data = request.json()

    ticker = request_data.get("ticker")

    data = get_advice_cache(ticker, ttl_hash=get_ttl_hash())

    # {"summary": string, "advice": string}
    return jsonify(data)


@endpoint.route('/get_graphs_news', methods=['POST'])
def get_stock_info():
    request_data = request.json()

    ticker = request_data.get("ticker")

    data = get_stock_info_cache(ticker, ttl_hash=get_ttl_hash())

    # return jsonify({"valid": bool, "company_name": string, \
    #                   "stock_history": list(dict(date, price))})
    return jsonify(data)

@endpoint.route('/price', methods=['GET'])
def get_price():
    ticker = request.args.get("ticker")
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400
    agg = yf_aggregator(ticker)
    if not agg.is_valid_ticker():
        return jsonify({"error": "invalid ticker"}), 404
    info = agg._get_company_info()
    return jsonify({
        "ticker": ticker,
        "price": info.get("currentPrice"),
        "currency": info.get("currency"),
    })

@endpoint.route('/convert', methods=['GET'])
def convert_currency():
    from_currency = request.args.get("from", "USD")
    to_currency = request.args.get("to", "CAD")
    if from_currency == to_currency:
        return jsonify({"rate": 1.0})
    try:
        pair = f"{from_currency}{to_currency}=X"
        ticker = yf.Ticker(pair)
        rate = ticker.fast_info.get("lastPrice")
        return jsonify({"rate": rate})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@endpoint.route('/search', methods=['GET'])
def search_ticker():
    query = request.args.get("q")
    if not query:
        return jsonify([])
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

if __name__ == '__main__':
    endpoint.run(host='0.0.0.0')
