"use client";

import { useMemo, useState, useEffect } from "react";

type RiskTolerance = "low" | "medium" | "high";
type investmentTime = "Short-term" | "Long-term";

type AnalysisResult = {
  summary: string;
  advice: string;
  riskLevel: string;
  pros: string[];
  cons: string[];
};

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [investedAmount, setInvestedAmount] = useState<string>("0");
  const [portfolioSize, setPortfolioSize] = useState<string>("100");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("medium");
  const [investmentTime, setInvestmentTime] = useState<investmentTime>("Long-term")
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currency, setCurrency] = useState<"CAD" | "USD">("CAD");
  const [shares, setShares] = useState<string>("1");
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [basePriceUSD, setBasePriceUSD] = useState<number | null>(null); 
  const [suggestions, setSuggestions] = useState<{ticker: string, name: string}[]>([]);
  const [confirmedTicker, setConfirmedTicker] = useState("AAPL");
  const [priceLoading, setPriceLoading] = useState(true);

  // Calculate position size as a percentage of portfolio
  const positionPercentage = useMemo(() => {
    const invested = Number(investedAmount);
    const portfolio = Number(portfolioSize);

    // if portfolio is empty or negative, or invested is negative
    if (!portfolio || portfolio <= 0 || invested < 0)
      return 0;

    // return the percentage
    return (invested / portfolio) * 100;
  }, [investedAmount, portfolioSize]);

  // Fetch ticker suggestions from backend as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!ticker || ticker.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`http://127.0.0.1:5001/search?q=${ticker}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [ticker]);

  // Fetch stock price when confirmedTicker changes
  useEffect(() => {
    if (!confirmedTicker) return;
    setPriceLoading(true); // start loading when ticker changes
    const delay = setTimeout(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5001/price?ticker=${confirmedTicker}`);
        const data = await res.json();
        if (data.price) {
          setBasePriceUSD(data.price);
          setShares("1"); // reset to 1 share when new ticker loads
          const rateRes = await fetch(`http://127.0.0.1:5001/convert?from=USD&to=${currency}`);
          const rateData = await rateRes.json();
          if (rateData.rate) {
            const converted = data.price * rateData.rate;
            setStockPrice(converted);
            setInvestedAmount((converted * 1).toFixed(2)); // use 1 directly since shares just reset
          } else {
            setStockPrice(data.price);
            setInvestedAmount((data.price * 1).toFixed(2));
          }
        } else {
          setStockPrice(null);
          setBasePriceUSD(null);
          setInvestedAmount("0");
          setShares("0");
        }
      } catch (e) {
        setStockPrice(null);
      } finally {
        setPriceLoading(false); // stop loading when done
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [confirmedTicker]);


  // Fetch exchange rate and convert price when currency changes
  useEffect(() => {
  if (!basePriceUSD) return;
  const fetchRate = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5001/convert?from=USD&to=${currency}`);
      const data = await res.json();
      if (data.rate) {
        // convert from base USD price
        const converted = basePriceUSD * data.rate;
        setStockPrice(converted);
        setInvestedAmount((converted * Number(shares)).toFixed(2));
      }
    } catch (e) {
      console.error("Failed to fetch exchange rate", e);
    }
  };
  fetchRate();
}, [currency]);

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
    <main className="min-h-screen bg-zinc-950 text-white lg:h-screen lg:overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-10 h-full flex flex-col lg:h-screen">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Stock Advisor</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your stock position details below.
          </p>
        </header>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_2fr] flex-1 min-h-0">

          {/* Stock Data Inputs */}
          <section className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 overflow-y-auto self-start">
            <h2 className="text-sm font-medium text-zinc-300">Inputs</h2>
            <div className="mt-4 grid gap-4">

              {/* Stock Ticker */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Stock (Ticker)</span>
                <input
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  value={ticker}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setTicker(val);
                    setConfirmedTicker(val);
                  }}
                  placeholder="e.g. AAPL"
                  list="ticker-list"
                />
                {/* dropdown suggestions */}
                <datalist id="ticker-list">
                  {(suggestions ?? []).map((t) => (
                    <option key={t.ticker} value={t.ticker}>{t.name}</option>
                  ))}
                </datalist>
              </label>

              {/* Amount to Invest and Shares*/}
              <div className="grid gap-1">
                <div className="flex gap-2">
                  {/* Shares input */}
                  <label className="grid gap-1 w-1/2">
                    <span className="text-xs text-zinc-400">Shares</span>
                    <input
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500 w-full"
                      value={shares}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Regex checks digits and decimals
                        // returns true or false
                        // only update if input is digits or decimals
                        if (/^\d*\.?\d*$/.test(val)) {
                          setShares(val);
                          // Update amount based on shares
                          if (stockPrice) setInvestedAmount((stockPrice * Number(val)).toFixed(2));
                        }
                      }}
                      placeholder="Shares"
                    />
                  </label>

                  {/* Amount input */}
                  <label className="grid gap-1 w-1/2">
                    <span className="text-xs text-zinc-400">Amount ($)</span>
                    <input
                      className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500 w-full"
                      value={investedAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Regex checks digits and decimals
                        // returns true or false
                        // only update if input is digits or decimals
                        if (/^\d*\.?\d*$/.test(val)) {
                          setInvestedAmount(val);
                          // Update shares based on amount
                          if (stockPrice && Number(val) > 0) {
                            setShares((Number(val) / stockPrice).toFixed(4));
                          }
                        }
                      }}
                      placeholder="Amount ($)"
                    />
                  </label>
                </div>

                {/* CAD / USD toggle */}
                <div className="grid gap-1 mt-2">
                  <span className="text-xs text-zinc-400">Currency</span>
                  <div className="flex gap-2">
                    {(["CAD", "USD"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                          currency === c
                            ? "bg-white text-zinc-900 border-white"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                    <span className="text-xs text-zinc-500 self-center">
                      {priceLoading ? "Fetching price..." : stockPrice ? `1 share = ${currency} $${stockPrice.toFixed(2)}`: "Price unavailable — enter amount manually"}
                    </span>
                  </div>
                </div>
              </div>   

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

              {/* Time to Invest */}
              <label className="grid gap-1">
                <span className="text-xs text-zinc-400">Investment Time Period</span>
                <select
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                  value={investmentTime}
                  onChange={(e) => setInvestmentTime(e.target.value as investmentTime)}
                >
                  <option value="Short-term">Short-term</option>
                  <option value="Long-term">Long-term</option>
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
          <section className="rounded-lg border border-zinc-700 bg-zinc-900 p-5 overflow-y-auto self-start">
            <h2 className="text-sm font-medium text-zinc-300">Results</h2>
            <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-sm h-[calc(100%-2rem)]">
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
