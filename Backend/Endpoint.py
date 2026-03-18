# app.py
from flask import Flask, request, jsonify
import yfinance as yf
from StickDataCollector import yf_aggregator

endpoint = Flask(__name__)


@endpoint.route('/', methods=['POST'])
def hello():
    request_data = request.get_json()

    # get context from yfinance news and general api functions

    # send context to gemini handler

    # get output from gemini handler

    # return jsonified output


if __name__ == '__main__':
    endpoint.run(host='0.0.0.0')
