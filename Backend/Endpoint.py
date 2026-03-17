# app.py
from flask import Flask, request, jsonify
import yfinance as yf

endpoint = Flask(__name__)


class yf_aggregator:
    def __init__(self, ticker: str):
        self.t = yf.Ticker(ticker)

    def is_valid_ticker(self, ticker: str) -> bool:
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



@endpoint.route('/', methods=['POST'])
def hello():
    request_data = request.get_json()

    # get context from yfinance news and general api functions

    # send context to gemini handler

    # get output from gemini handler

    # return jsonified output


if __name__ == '__main__':
    endpoint.run(host='0.0.0.0')
