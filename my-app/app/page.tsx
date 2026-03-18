"use client";

import { useMemo, useState } from "react";

type RiskTolerance = "low" | "medium" | "high";

type AnalysisResult = {
  summary: string;
  advice: string;
  riskLevel: string;
  pros: string[];
  cons: string[];
};
// temporary - just hard coded for now
const TICKERS = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "GOOGL", name: "Alphabet (Google)" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "META", name: "Meta" },
  { ticker: "BRK.B", name: "Berkshire Hathaway" },
  { ticker: "JPM", name: "JPMorgan Chase" },
  { ticker: "V", name: "Visa" },
  { ticker: "SPY", name: "S&P 500 ETF" },
  { ticker: "QQQ", name: "Nasdaq 100 ETF" },
  { ticker: "GLD", name: "Gold ETF" },
];

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [investedAmount, setInvestedAmount] = useState<string>("1000");
  const [portfolioSize, setPortfolioSize] = useState<string>("10000");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("medium");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const positionPercentage = useMemo(() => {
    const invested = Number(investedAmount);
    const portfolio = Number(portfolioSize);

    // if portfolio is empty or negative, or invested is negative
    if (!portfolio || portfolio <= 0 || invested < 0)
      return 0;

    // return the percentage
    return (invested / portfolio) * 100;
  }, [investedAmount, portfolioSize]);

  const filteredTickers = useMemo(() => {
    return TICKERS.filter(
      (t) => t.ticker.includes(ticker) || t.name.toUpperCase().includes(ticker) // match ticker or name
    ).slice(0, 10); // limit to 10 results in dropdown
  }, [ticker]);

  const handleAnalyze = () => {
    setLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Mock data based on which ticker is selected
      const mockResults: {
  [key: string]: AnalysisResult
} = {
        AAPL: {
          summary: "Apple Inc. shows strong performance with recent product launches. Revenue grew 5% in Q1 2024 with services segment reaching all-time high. iPhone sales remain stable despite market competition.",
          advice: `Based on your $${investedAmount} investment and ${riskTolerance} risk tolerance, consider dollar-cost averaging into this position over 3 months.`,
          riskLevel: riskTolerance === "low" ? "Low" : riskTolerance === "medium" ? "Medium" : "High",
          pros: ["Strong brand loyalty", "Growing services revenue", "Healthy cash reserves"],
          cons: ["Market saturation", "Regulatory challenges", "Supply chain dependencies"]
        },
        MSFT: {
          summary: "Microsoft continues to dominate cloud computing with Azure growth of 20%. AI integration across products is driving new revenue streams. Strong enterprise relationships provide stability.",
          advice: `With your $${investedAmount} portfolio and ${riskTolerance} tolerance, Microsoft offers balanced growth potential.`,
          riskLevel: riskTolerance === "low" ? "Low" : riskTolerance === "medium" ? "Medium" : "Medium",
          pros: ["Cloud leadership", "AI innovation", "Recurring revenue"],
          cons: ["High valuation", "Regulatory scrutiny", "Competition from AWS"]
        },
        NVDA: {
          summary: "NVIDIA is the undisputed leader in AI chips with 80% market share. Data center revenue doubled year-over-year. New product launches continue to push performance boundaries.",
          advice: `$${investedAmount} in NVIDIA aligns with your ${riskTolerance} profile, but consider the high volatility.`,
          riskLevel: "High",
          pros: ["AI market leader", "Strong growth", "High margins"],
          cons: ["Very volatile", "High valuation", "Competition increasing"]
        }
      };

      // Use mock data for the selected ticker, or a default if not found
      const selectedResult = mockResults[ticker] || {
        summary: `${ticker} is showing mixed signals in recent trading. Consider monitoring closely before making decisions.`,
        advice: `With $${investedAmount} at ${riskTolerance} risk, diversify across sectors to reduce exposure.`,
        riskLevel: riskTolerance === "low" ? "Low" : riskTolerance === "medium" ? "Medium" : "High",
        pros: ["Liquid stock", "Market presence", "Analyst coverage"],
        cons: ["Recent volatility", "Earnings soon", "Sector headwinds"]
      };
      
      setResult(selectedResult);
      setLoading(false);
    }, 2000); // 2 second delay to simulate loading
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Stock Advisor</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your stock position details below.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">

          {/* Stock Data Inputs */}
          <section className="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
            <h2 className="text-sm font-medium text-zinc-300">Inputs</h2>

            <div className="mt-4 grid gap-4">

              {/* Stock Ticker */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Stock (Ticker)</span>
                <input
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())} // force user input to be capitalized
                  placeholder="e.g. AAPL or Apple"
                  list="ticker-list"
                />
                {/* dropdown suggestions from filteredTickers */}
                <datalist id="ticker-list">
                  {filteredTickers.map((t) => (
                    <option key={t.ticker} value={t.ticker}>{t.name}</option>
                  ))}
                </datalist>
              </label>

              {/* Amount to Invest */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Amount to Invest ($)</span>
                <input
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  value={investedAmount}
                  onChange={(e) => {
                    // Regex checks digits
                    // returns true or false
                    // only update if input is digits
                    if (/^\d*$/.test(e.target.value)) setInvestedAmount(e.target.value);
                  }}
                  placeholder="1000"
                />
              </label>
              
              {/* Position size - editable */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Portfolio Size ($)</span>
                <input
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  value={portfolioSize}
                  onChange={(e) => {
                    // Regex checks digits
                    // returns true or false
                    // only update if input is digits
                    if (/^\d*$/.test(e.target.value)) setPortfolioSize(e.target.value);
                  }}
                  placeholder="10000"
                />
              </label>

              {/* Position size - not editable, just calculated */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Position Size</span>
                  <span className="text-sm">{positionPercentage.toFixed(1)}%</span> {/* 1 decimal place */}
                </div>
              </div>
              
              {/* Risk Tolerance */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Risk Tolerance</span>
                <select
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  value={riskTolerance}
                  onChange={(e) => setRiskTolerance(e.target.value as RiskTolerance)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              {/* Analyze Button */}
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          </section>

          {/* Results */}
          <section className="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
            <h2 className="text-sm font-medium text-zinc-300">Results</h2>
            <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-sm">
              {loading ? (
                <div className="text-zinc-400">Loading analysis...</div>
              ) : result ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-white">Summary</h3>
                    <p className="text-zinc-300">{result.summary}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-white">Advice</h3>
                    <p className="text-zinc-300">{result.advice}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-white">Risk Level: 
                      <span className={`ml-2 ${
                        result.riskLevel === "Low" ? "text-green-400" : 
                        result.riskLevel === "Medium" ? "text-yellow-400" : 
                        "text-red-400"
                      }`}>
                        {result.riskLevel}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-400">Pros</h4>
                      <ul className="list-disc pl-4 text-zinc-300">
                        {result.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-400">Cons</h4>
                      <ul className="list-disc pl-4 text-zinc-300">
                        {result.cons.map((con, i) => <li key={i}>{con}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-400">Click Analyze to see results</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}