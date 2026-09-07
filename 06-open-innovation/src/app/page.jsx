"use client";

import { useMemo, useState } from "react";

const seed = [
  { id: 1, title: "Cooler classroom commutes", category: "Climate", problem: "Students wait in unshaded areas during the hottest part of the day.", author: "Mira S.", votes: 24, comments: ["Could local bus stops double as shade structures?"], status: "Open" },
  { id: 2, title: "Food rescue for small kitchens", category: "Community", problem: "Neighbourhood cafés discard safe food because matching it with nearby demand takes too long.", author: "Jon A.", votes: 18, comments: ["A pickup window would make the handoff predictable."], status: "Open" },
  { id: 3, title: "A plain-language care guide", category: "Health", problem: "Families leave appointments unsure which recovery steps matter most.", author: "Nia K.", votes: 31, comments: ["Translations and accessibility need to be first-class."], status: "In review" },
];

const categories = ["All", "Climate", "Community", "Health", "Education", "Mobility"];
const blank = { title: "", category: "Climate", problem: "" };

function List({ title, values }) { return <section className="insight-list"><h4>{title}</h4><ul>{values?.map((value, index) => <li key={index}>{value}</li>)}</ul></section>; }

export default function CommonGround() {
  const [ideas, setIdeas] = useState(seed);
  const [selectedId, setSelectedId] = useState(seed[0].id);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [form, setForm] = useState(blank);
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState("");
  const [voted, setVoted] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState("");
  const [analysing, setAnalysing] = useState(false);

  const visible = useMemo(() => ideas.filter((idea) => (category === "All" || idea.category === category) && `${idea.title} ${idea.problem}`.toLowerCase().includes(search.toLowerCase())), [ideas, category, search]);
  const selected = ideas.find((idea) => idea.id === selectedId) || visible[0] || ideas[0];

  function select(id) { setSelectedId(id); setAnalysis(null); setAnalysisError(""); }
  function vote(id) { if (voted.includes(id)) return; setIdeas((current) => current.map((idea) => idea.id === id ? { ...idea, votes: idea.votes + 1 } : idea)); setVoted((current) => [...current, id]); }
  function submitIdea(event) { event.preventDefault(); if (!form.title.trim() || !form.problem.trim()) { setMessage("Give the idea a title and a short problem statement."); return; } const idea = { id: Date.now(), title: form.title.trim(), category: form.category, problem: form.problem.trim(), author: "You", votes: 0, comments: [], status: "Open" }; setIdeas((current) => [idea, ...current]); setSelectedId(idea.id); setForm(blank); setMessage("Your idea is now open for feedback."); setAnalysis(null); }
  function addComment(event) { event.preventDefault(); if (!comment.trim()) return; setIdeas((current) => current.map((idea) => idea.id === selected.id ? { ...idea, comments: [...idea.comments, comment.trim()] } : idea)); setComment(""); }
  async function analyse() { setAnalysing(true); setAnalysis(null); setAnalysisError(""); try { const response = await fetch("/api/analyse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: selected.title, description: selected.problem, category: selected.category }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Analysis failed."); setAnalysis(payload); } catch (error) { setAnalysisError(error.message); } finally { setAnalysing(false); } }

  return <main><header className="masthead"><a href="#top" className="brand">common<span>ground</span></a><p>A small place for useful ideas.</p><a className="jump" href="#submit">Share an idea ↘</a></header><section className="hero" id="top"><p className="kicker">OPEN INNOVATION BOARD</p><h1>Problems worth<br /><em>working on.</em></h1><p>Bring a specific challenge into the room. Explore early solutions with people who care about making a practical difference.</p></section><section className="board"><aside className="sidebar"><div><label htmlFor="search">Find a challenge</label><input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ideas" /></div><div className="filters" aria-label="Categories">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><p className="count">{visible.length} ideas in view</p>{visible.length ? <div className="idea-list">{visible.map((idea) => <button key={idea.id} onClick={() => select(idea.id)} className={selected.id === idea.id ? "idea active-idea" : "idea"}><span>{idea.category}</span><strong>{idea.title}</strong><small>{idea.votes} voices</small></button>)}</div> : <div className="no-results">No ideas match that search.</div>}</aside><article className="detail"><div className="detail-head"><span className="pill">{selected.category}</span><span>{selected.status}</span></div><h2>{selected.title}</h2><p className="problem">{selected.problem}</p><div className="byline">Shared by {selected.author} <button onClick={() => vote(selected.id)} disabled={voted.includes(selected.id)}>{voted.includes(selected.id) ? "Supported" : "Support this"} · {selected.votes}</button></div><section className="feedback"><h3>Feedback <span>{selected.comments.length}</span></h3>{selected.comments.length ? selected.comments.map((item, index) => <p key={index}>{item}</p>) : <p className="muted">No feedback yet. Start the conversation.</p>}<form onSubmit={addComment}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Offer a useful thought" aria-label="Feedback" /><button>Post</button></form></section><section className="ai-box"><div><p className="kicker">OPTIONAL AI LENS</p><h3>Map the opportunity</h3><p>Get a concise starting analysis. It is a prompt for discussion, not a verdict.</p></div><button onClick={analyse} disabled={analysing}>{analysing ? "Analysing…" : "Analyse idea"}</button>{analysisError && <p className="ai-error">{analysisError}</p>}{analysis && <div className="analysis"><p><b>Summary</b>{analysis.summary}</p><List title="Potential solutions" values={analysis.solutions} /><div className="analysis-grid"><p><b>Difficulty</b>{analysis.difficulty}</p><List title="Required technology" values={analysis.technology} /><List title="Risks" values={analysis.risks} /><List title="Potential users" values={analysis.users} /></div></div>}</section></article></section><section className="submit" id="submit"><div><p className="kicker">ADD TO THE BOARD</p><h2>Start with the<br /><em>real problem.</em></h2><p>The clearest challenges get the most useful response.</p></div><form onSubmit={submitIdea}><label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="A short, memorable name" /></label><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label>What needs to change?<textarea value={form.problem} onChange={(event) => setForm({ ...form, problem: event.target.value })} placeholder="Describe the problem, who feels it, and why it matters." /></label>{message && <p className="form-message">{message}</p>}<button className="submit-button">Open this idea →</button></form></section></main>;
}
