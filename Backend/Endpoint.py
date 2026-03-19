# app.py
from flask import Flask, request, jsonify
from StockDataCollector import yf_aggregator
from LLMHandler import generate_summary
from functools import lru_cache
from typing import Any, List, Dict, Optional
import time
import threading

endpoint = Flask(__name__)


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


if __name__ == '__main__':
    endpoint.run(host='0.0.0.0')
