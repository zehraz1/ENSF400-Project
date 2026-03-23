import os 
import re
import concurrent.futures 
from typing import List, Dict, Any, Optional 

from google import genai


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
        self.client = None

        # only configure Gemini if API key is available
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def is_configured(self) -> bool:
        """
        Check if the Gemini model is configured properly.
        """
        return self.client is not None
    
    def _safe_to_text(self, value: Any) -> str:
        """
        Convert Python valuues into readable text for prompt.
        """
        if value is None:
            return "N/A"
        
        if isinstance(value, list):
            return "\n".join([self._safe_to_text(item) for item in value])
        
        if isinstance(value, dict):
            lines = [] 
            for key, val in value.items():
                lines.append(f"{key}: {self._safe_to_text(val)}")
            return "\n".join(lines)
        
        return str(value)

    def build_prompt(self, fin: Dict[str, Any], news: List[Dict[str, Any]],
                      risk_tolerance: str) -> str:
        """
        Build the prompt that will be sent to Gemini. 
        Goal: to generate a readable performance summary, 
        NOT direct financial advice.
        """

        ticker = fin.get("ticker", "Unknow")
        company_info = fin.get("company_info", {})
        analyst_targets = fin.get("analystPricetargets", {})
        calendar = fin.get("calendar", {})
        option_chain = fin.get("optionChainSummary", {})
        risk_metrics = fin.get("riskMetrics", {})

        # format news into a compact readable block 
        formatted_news = []
        for article in news[:5]:  # limit to top 5 news items
            formatted_news.append(
                f"- Title: {article.get('title', 'N/A')}\n"
                f" Publisher: {article.get('publisher', 'N/A')}\n"
                f" Summary: {article.get('summary', 'N/A')}"
            ) 
        news_block = "\n\n".join(formatted_news) if formatted_news else "No recent news available."

        prompt = f"""
            You are a financial analysis assitant for a stock advisor application. 

            Your task is to summarize the stock in a clear, balanced, and beginner-friendly way.
            DO NOT guarantee returns. 
            DO NOT make absolute claims. 
            DO NOT tell the user to buy or sell. 
            DO NOT provide personalized financial advice. 

            Write the response in this format exactly: 

            Summary: 
            <2-4 sentence stock overview> 

            Pros: 
            <3-5 bullet points of positive aspects> 

            Cons:
            <3-5 bullet points of negative aspects> 

            Stock data: 
            Ticker: {ticker} 
            Company Info: 
            {self._safe_to_text(company_info)}
            Analyst Price Targets:
            {self._safe_to_text(analyst_targets)}
            Calendar:
            {self._safe_to_text(calendar)}
            Option Chain Summary:
            {self._safe_to_text(option_chain)}
            Risk Metrics:
            {self._safe_to_text(risk_metrics)}
            User Risk Tolerance: {risk_tolerance}
            Recent News:
            {news_block}
"""
        return prompt.strip()
    
    def _call_model(self, prompt: str) -> str:
        """
        Internal helper to call Gemini and return the raw text response.
        """ 
        if not self.is_configured():
            raise RuntimeError("Gemini API is not configured. Missing GEMINI_API_KEY")
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt
        )

        # some SDK responses expose .text directly 
        text = getattr(response, "text", None)

        if text and text.strip():
            return text.strip()
        
        # fallback if .text is not available or empty 
        return "Summary: \nUnable to generate summary at this time.\n\nPros:\n- N/A\n- N/A\n- N/A\n\nCons:\n- N/A\n- N/A\n- N/A"
    
    def _parse_output(self, text: str) -> Dict[str, Any]:
        """"
        Parse Gemini text into structured fields for the frontend/backend.
        """

        result = {
            "summary": "",
            "pros": [],
            "cons": [], 
            "rawText": text
        }

        current_section: Optional[str] = None

        for raw_line in text.splitlines():
            line = raw_line.strip() 

            if not line:
                continue

            lower = line.lower()

            if lower.startswith("summary:"):
                current_section = "summary"
                content = line[len("summary:"):].strip()
                if content:
                    result["summary"] += self._strip_markdown(content) + " "
                continue
            
            if lower.startswith("pros:"):
                current_section = "pros"
                continue

            if lower.startswith("cons:"):
                current_section = "cons"
                continue

            if current_section == "summary":
                result["summary"] += self._strip_markdown(line) + " " 
            
            elif current_section == "pros":
                if line.startswith("-") or line.startswith("*"):
                    result["pros"].append(self._strip_markdown(line[1:].strip()))
                else:
                    result["pros"].append(self._strip_markdown(line))
            
            elif current_section == "cons":
                if line.startswith("-") or line.startswith("*"):
                    result["cons"].append(self._strip_markdown(line[1:].strip()))
                else:
                    result["cons"].append(self._strip_markdown(line))

        # final cleanup
        result["summary"] = result["summary"].strip()

        # provide defaults if model output is imperfect 
        if not result["summary"]:
            result["summary"] = "No summary available." 
        
        if not result["pros"]:
            result["pros"] = ["N/A"]
        
        if not result["cons"]:
            result["cons"] = ["N/A"]
        
        return result

    # added defensive code here
    def generate_summary(self, fin: Dict[str, Any], news: List[Dict[str, Any]], risk_tolerance: str) -> Dict[str, Any]:
        """
        Generate a structured summary from financial data and news. 
        Handles: 
        - missing API key 
        - model failures 
        - malformed responses
        """

        if not self.is_configured():
            return {
                "summary": "Unable to generate summary. Gemini API key is not configured.",
                "pros": ["N/A"],
                "cons": ["N/A"],
                "rawText": "", 
                "error": "Gemini API is not configured."
            }
        
        try: 
            prompt = self.build_prompt(fin, news, risk_tolerance)
            raw_text= self._call_model(prompt)
            parsed = self._parse_output(raw_text)
            parsed["error"] = None
            return parsed
        except Exception as e:
            return {
                "summary": "Unable to generate summary at this time.",
                "pros": ["N/A"],
                "cons": ["N/A"],
                "rawText": "",
                "error": str(e)
            }
        
    def generate_summary_with_timeout(
            self, 
            fin: Dict[str, Any],
            news: List[Dict[str, Any]],
            risk_tolerance: str, 
            timeout_seconds: int = 30, 
    ) -> Dict[str, Any]:
        """
        Generate summary with timeout protection since we are using 3rd party here. 
        Added this as per our documentation.  
        """

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(self.generate_summary, fin, news, risk_tolerance)

            try:
                return future.result(timeout=timeout_seconds)

            except concurrent.futures.TimeoutError:
                return {
                    "summary": "The analysis took too long and timed out.",
                    "pros": ["Stock data may still be available"],
                    "cons": ["LLM request exceeded timeout limit"],
                    "rawText": "",
                    "error": f"Timeout after {timeout_seconds} seconds",
                }
    
    def _strip_markdown(self, text: str) -> str:
        text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)  
        text = re.sub(r'\*(.*?)\*', r'\1', text)        
        return text.strip()


