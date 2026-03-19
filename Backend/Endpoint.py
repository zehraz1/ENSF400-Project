from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
from StockDataCollector import yf_aggregator
from StockDataCollector import yf_aggregator
from LLMHandler import generate_summary, generate_advice

endpoint = Flask(__name__)
CORS(endpoint)

print("🚀 Starting Flask server...")

@endpoint.route('/', methods=['POST'])
def hello():
    print("📡 Received a request!")
    request_data = request.get_json()
    print(f"📊 Data: {request_data}")

    # get context from yfinance news and general api functions

    # send context to gemini handler

    # get output from gemini handler

    # return jsonified output
    ticker = request_data.get("ticker")
    
    # Get user inputs for Feature 04
    invested_amount = request_data.get("invested_amount")
    portfolio_size = request_data.get("portfolio_size")
    risk_tolerance = request_data.get("risk_tolerance")

    agg = yf_aggregator(ticker)

    # get context from yfinance news and general api functions
    fin = agg.get_fin_data()
    news = agg.get_news_data()
    print(f"📈 Got finance data, news count: {len(news) if news else 0}")

    # Generate summary (Feature 03)
    summary = generate_summary(fin, news)
    print(f"🤖 Got summary from Gemini")

    # Generate personalized advice (Feature 04)
    user_inputs = {
        "invested_amount": invested_amount,
        "portfolio_size": portfolio_size,
        "risk_tolerance": risk_tolerance
    }
    advice = generate_advice(fin, news, user_inputs)
    print(f"💡 Got advice from Gemini")

    # return jsonified output with both summary and advice
    return jsonify({
        "ticker": ticker, 
        "summary": summary,
        "advice": advice
    })

if __name__ == '__main__':
    print("🌐 Server will be available at http://localhost:5000")
    endpoint.run(host='0.0.0.0', debug=True)