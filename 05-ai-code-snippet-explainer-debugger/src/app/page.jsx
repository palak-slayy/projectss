"use client";

import { useState } from "react";

const starter = `function total(items) {
  let sum = 0;
  for (let i = 0; i <= items.length; i++) {
    sum += items[i].price;
  }
  return sum;
}`;

export default function Trace() {
  const [code, setCode] = useState(starter);
  const [language, setLanguage] = useState("JavaScript");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!code.trim()) { setError("Paste or write some code before analysing it."); setResult(null); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/analyse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, language }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "The analysis could not be completed.");
      setResult({ ...payload, steps: code.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 5) });
    } catch (requestError) { setError(requestError.message || "The analysis could not be completed."); }
    finally { setLoading(false); }
  }

  function loadExample() { setCode(starter); setResult(null); setError(""); }

  return <main><nav><a className="logo" href="#top">trace<span>/</span></a><p>Read the code. Find the signal.</p><button onClick={loadExample}>Load example</button></nav><section className="intro" id="top"><p className="eyebrow">AI CODE REVIEW</p><h1>Make the <i>next fix</i><br />the right one.</h1><p>A focused workspace for explaining code, catching bugs, and turning them into clear next steps. It does not execute submitted code.</p></section><section className="workspace"><div className="editor"><header><div><span className="dot red" /><span className="dot yellow" /><span className="dot green" /></div><select aria-label="Language" value={language} onChange={(event) => setLanguage(event.target.value)}><option>JavaScript</option><option>TypeScript</option><option>Python</option><option>Java</option></select></header><label htmlFor="code">Code input</label><textarea id="code" value={code} onChange={(event) => setCode(event.target.value)} spellCheck="false" placeholder="Paste code here…" /><footer><span>{code.split("\n").length} lines</span><button onClick={run} disabled={loading}>{loading ? "Reviewing…" : "Analyse snippet"} <b>→</b></button></footer></div><div className="analysis">{!result && !error && !loading && <div className="empty"><span>{"{ }"}</span><h2>Ready when you are.</h2><p>Choose a language, paste code, then run an AI analysis.</p></div>}{loading && <div className="empty"><span>···</span><h2>Reviewing quickly.</h2><p>This concise review should return shortly; it stops after 15 seconds if the service is slow.</p></div>}{error && <div className="error"><b>Analysis unavailable.</b><p>{error}</p></div>}{result && <><header><p className="eyebrow">AI ANALYSIS / {language.toUpperCase()}</p><h2>What the code <i>does.</i></h2></header><section className="summary"><span>PLAIN-LANGUAGE SUMMARY</span><p>{result.summary}</p><details><summary>Show the first steps read</summary><ol>{result.steps.map((step, index) => <li key={index}><code>{step}</code></li>)}</ol></details></section>{result.findings.map((finding, index) => <article key={index}><p className="tag">{finding.kind}</p><h3>{finding.problem}</h3><dl><div><dt>CAUSE</dt><dd>{finding.cause}</dd></div><div><dt>FIX</dt><dd><code>{finding.fix}</code></dd></div><div><dt>EXPLANATION</dt><dd>{finding.explanation}</dd></div></dl></article>)}</>}</div></section></main>;
}
