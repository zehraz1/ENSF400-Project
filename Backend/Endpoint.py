# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import StockDataCache as cache

endpoint = Flask(__name__)
CORS(endpoint, resources={r"/*": {"origins": "http://localhost:3000"}})


@endpoint.route('/', methods=['POST'])
def get_advice():
    """Get stock advice in the form
        {   "label": label,
            "message": message,
            "confidenceNote": confidence_note,
            "investedAmount": invested_amount,
            "portfolioSize": portfolio_size,
            "userRiskTolerance": user_risk  }
    and cache for efficiency
    """
    ticker = request.args.get("ticker")
    invested_amnt = request.args.get("invested_amount")
    portfolio = request.args.get("portfolio_size")
    user_risk = request.args.get("user_risk", "medium")
    if (not ticker) or (not invested_amnt) or (not portfolio):
        return jsonify({"error": "missing a required field"}), 400

    advice = cache.get_advice_cache(
            ticker, invested_amnt, portfolio,
            user_risk, ttl_hash=cache.get_ttl_hash())

    print(advice)
    return(advice)


@endpoint.route('/get_graphs_news', methods=['POST'])
def get_stock_info():
    """Get stock info in the form
    {"company name" ..., "stock history" ..., "news": ...}
    and cache for efficiency
    """
    ticker = request.args.get("ticker")
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    return cache.get_stock_info_cache(ticker, ttl_hash=cache.get_ttl_hash())


@endpoint.route('/price', methods=['GET'])
def get_price():
    """
    Get the most recent price for a stock
    """
    # ensure we have a ticker
    ticker = request.args.get("ticker")
    if not ticker:
        return jsonify({"error": "ticker is required"}), 400

    # get the cached response
    # we lower the ttl on this because we want the current price to update more
    # frequently than something like the last 6 months of history
    return cache.get_price_cache(ticker, ttl_hash=cache.get_ttl_hash(60))


@endpoint.route('/convert', methods=['GET'])
def convert_currency():
    """ get the conversion rate between two currencies.
    cache for efficiency
    """
    # ensure the inputs are correct
    from_currency = request.args.get("from", "USD")
    to_currency = request.args.get("to", "CAD")
    if (not from_currency) or (not to_currency):
        return jsonify({"error": "both currencies required"}), 400

    return cache.convert_currency_cache(from_currency, to_currency,
                                        ttl_hash=cache.get_ttl_hash())


@endpoint.route('/search', methods=['GET'])
def search_ticker():
    """
    Gets valid ticker suggestions from some typed search
    """
    query = request.args.get("q")
    if not query:
        return jsonify([])

    # search in cache with no ttl because this shouldnt change
    # and will be called quite often
    return cache.search_ticker_cache(query)


if __name__ == '__main__':
    endpoint.run(host='0.0.0.0')
