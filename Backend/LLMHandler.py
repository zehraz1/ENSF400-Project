import google.generativeai as genai

KEY = "AIzaSyDxErgWTJMtIT7GxDouy1ywNcPIHQkHu9k"

genai.configure(api_key=KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

def build_prompt(fin, news):
    return f"""
    Consider yourself as a financial assistant.

    Summarize the company's recent performance and news.

    Stock Data:
    {fin}

    News Headlines:
    {news}

    Requirements:
    - Be concise (5-7 sentences)
    - Do NOT give investment advice
    - Keep it beginner-friendly
    """

def build_advice_prompt(fin, news, user_inputs):
    """
    user_inputs = {
        "invested_amount": 1000,
        "portfolio_size": 10000,
        "risk_tolerance": "medium"
    }
    """
    return f"""
    Consider yourself as a professional financial advisor.

    You are giving personalized investment advice to a client.

    Stock Data:
    {fin}

    News Headlines:
    {news}

    Client Profile:
    - Investment Amount: ${user_inputs['invested_amount']}
    - Total Portfolio Size: ${user_inputs['portfolio_size']}
    - Risk Tolerance: {user_inputs['risk_tolerance']} (Low/Medium/High)

    Based on this information, provide personalized investment advice with:

    1. A clear recommendation: Should they INVEST, HOLD, or WITHDRAW from this stock?
    2. Risk Level: {user_inputs['risk_tolerance']} (just repeat their risk tolerance)
    3. Pros: List 3 specific pros for investing in this stock right now
    4. Cons: List 3 specific cons for investing in this stock right now
    5. Brief explanation: Consider their portfolio size and investment amount in your reasoning

    Format your response exactly like this:

    RECOMMENDATION: [Invest/Hold/Withdraw]
    RISK LEVEL: [Low/Medium/High]
    
    PROS:
    - [Pro 1]
    - [Pro 2]
    - [Pro 3]
    
    CONS:
    - [Con 1]
    - [Con 2]
    - [Con 3]
    
    EXPLANATION: [Your personalized explanation considering their portfolio size and investment amount]
    """

def generate_summary(fin, news):
    prompt = build_prompt(fin, news)
    response = model.generate_content(prompt)
    return response.text

def generate_advice(fin, news, user_inputs):
    """
    Generate personalized investment advice based on stock data and user inputs
    """
    prompt = build_advice_prompt(fin, news, user_inputs)
    response = model.generate_content(prompt)
    return response.text