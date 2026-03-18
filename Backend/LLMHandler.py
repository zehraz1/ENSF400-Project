import google.generativeai as genai

KEY = "substitute with your key"

client = genai.configure(api_key=KEY)
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

def generate_summary(fin, news):
    prompt = build_prompt(fin, news)

    response = model.generate_content(prompt)
    
    return response.text
