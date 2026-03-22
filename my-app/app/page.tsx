"use client";

import { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type RiskTolerance = "low" | "medium" | "high";
type investmentTime = "Short-term" | "Long-term";

type AnalysisResult = {
  summary: string;
  advice: string;
  riskLevel: string;
  pros: string[];
  cons: string[];
};

type StockHistoryItem = {
    date: string;
    close: number;
    open: number;
    high: number;
    low: number;
    volume: number;
  };

export default function Home() {
  const [ticker, setTicker] = useState("AAPL");
  const [investedAmount, setInvestedAmount] = useState<string>("0");
  const [portfolioSize, setPortfolioSize] = useState<string>("100");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>("medium");
  const [investmentTime, setInvestmentTime] = useState<investmentTime>("Long-term");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currency, setCurrency] = useState<"CAD" | "USD">("CAD");
  const [shares, setShares] = useState<string>("1");
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [basePriceUSD, setBasePriceUSD] = useState<number | null>(null); 
  const [suggestions, setSuggestions] = useState<{ticker: string, name: string}[]>([]);
  const [confirmedTicker, setConfirmedTicker] = useState("AAPL");
  const [priceLoading, setPriceLoading] = useState(true);
  const [chartData, setChartData] = useState<{date: string, price: number}[]>([]);
  const [chartPeriod, setChartPeriod] = useState<string>("1mo");

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
      } catch {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [ticker]);

  // Fetch stock price when confirmedTicker changes
  useEffect(() => {
    if (!confirmedTicker) return;
    setPriceLoading(true); // start loading when ticker changes
    setResult(null); // clear previous analysis when ticker changes
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
      } catch {
        setStockPrice(null);
      } finally {
        setPriceLoading(false); // stop loading when done
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [confirmedTicker, currency]);


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
}, [currency, basePriceUSD, shares]);

  // Fetch stock history for chart when confirmedTicker changes
  useEffect(() => {
    if (!confirmedTicker) return;

    const fetchChartData = async () => {
      try {
        const res = await fetch(
          `http://localhost:5001/get_graphs_news?ticker=${confirmedTicker}&period=${chartPeriod}`,
          { method: "POST" }
        );
        const data = await res.json();

        if (data.stock_history) {
          setChartData(data.stock_history.map((d: StockHistoryItem) => ({
            date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            price: parseFloat(d.close.toFixed(2)),
          })));
        }
      } catch {
        setChartData([]);
      }
    };

    fetchChartData();
  }, [confirmedTicker, chartPeriod]);
  

  // Send user inputs to the backend and display the AI-generated recommendation
  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const params = new URLSearchParams({
        ticker: confirmedTicker,
        invested_amount: investedAmount,
        portfolio_size: portfolioSize,
        user_risk: riskTolerance,
      });
      const res = await fetch(`http://localhost:5001/?${params}`, { method: "POST" });
      const data = await res.json();

      setResult({
        summary: data.message,
        advice: data.confidenceNote,
        riskLevel: data.userRiskTolerance === "low" ? "Low"
          : data.userRiskTolerance === "high" ? "High"
          : "Medium",
        pros: data.pros ?? [], 
        cons: data.cons ?? [],
      });
    } catch (e) {
      console.error("Analysis failed", e);
    } finally {
      setLoading(false);
    }
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

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_3fr] flex-1 min-h-0">

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

            {/* Chart period selector */}
            {chartData.length > 0 && stockPrice !== null ? (
              <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xs text-zinc-400">{confirmedTicker} — Price History</h3>
                  {/* Period toggle buttons */}
                  <div className="flex gap-1 flex-wrap">
                   {[
                      { label: "1W", value: "5d" },
                      { label: "1M", value: "1mo" },
                      { label: "6M", value: "6mo" },
                      { label: "1Y", value: "1y" },
                      { label: "ALL", value: "max" },
                    ].map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setChartPeriod(p.value)}
                        className={`px-2 py-1 rounded text-xs font-medium border ${
                          chartPeriod === p.value
                            ? "bg-white text-zinc-900 border-white"
                            : "bg-zinc-900 text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={35} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                      labelStyle={{ color: "#a1a1aa" }}
                      itemStyle={{ color: "#ffffff" }}
                    />
                    <Line type="monotone" dataKey="price" stroke="#ffffff" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-sm h-[calc(100%-2rem)] text-zinc-400">
                Graph cannot be displayed for this stock.
              </div>
            )}

            {/* Analysis results */}
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
