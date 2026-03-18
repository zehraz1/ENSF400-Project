import os 
import concurrent.futures 
from typing import List, Dict, Any, Optional 

import google.generativeai as genai

KEY = "substitute with your key"

class LLMHandler:
    """
    This class is responsible for handling the following: 
    - configure Gemini model 
    - build prompts from financial/news data 
    - generate summary with the use of Gemini 
    - handle timeouts and API errors
    """

    def __init__(self):
        """
        Initialize the Gemini client using an env variable.
        """
        # Read API key from environment variable
        self.api_key = os.getenv("GENAI_API_KEY") 

        # stoere model name 
        self.model_name = "gemini-2.5-flash" # check version here 

        # model starts as None until configured
        self.model = None

        # only configure Gemini if API key is available
        if self.api_key:
            genai.configure(api_key=self.api_key) 
            self.model = genai.GenerativeModel(self.model_name)

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
