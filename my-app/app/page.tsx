"use client";

import { useMemo, useState } from "react";

type RiskTolerance = "low" | "medium" | "high";

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

              {/* Analyze */}
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900">Analyze</button>
            </div>
          </section>

          {/* Results */}
          <section className="rounded-lg border border-zinc-700 bg-zinc-900 p-5">
            <h2 className="text-sm font-medium text-zinc-300">Results</h2>
            <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-800 p-4 text-sm text-zinc-400">Results section</div>
          </section>
        </div>
      </div>
    </main>
  );
}