# app.py
from flask import Flask, request, jsonify
import yfinance as yf
from StockDataCollector import yf_aggregator
from LLMHandler import generate_summary

endpoint = Flask(__name__)


@endpoint.route('/', methods=['POST'])
def hello():
    request_data = request.get_json()

    #not sure how we are getting the data from the front end for now
    ticker = request_data.get("ticker")

    agg = yf_aggregator(ticker)

    # get context from yfinance news and general api functions
    fin = agg.get_fin_data()
    news = agg.get_news_data()

    # send context to gemini handler

    # get output from gemini handler
    summary = generate_summary(fin, news)

    # return jsonified output
    return jsonify({"ticker": ticker, "summary": summary})


if __name__ == '__main__':
    endpoint.run(host='0.0.0.0')
