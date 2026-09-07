"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Profile = { login: string; name: string | null; avatar_url: string; bio: string | null; location: string | null; blog: string; public_repos: number; followers: number; following: number; html_url: string; created_at: string };
type Repo = { id: number; name: string; html_url: string; description: string | null; language: string | null; stargazers_count: number; forks_count: number; updated_at: string; fork: boolean };

const languageColors: Record<string, string> = { TypeScript: "#3178c6", JavaScript: "#d8b53b", Python: "#3572a5", Java: "#b07219", CSS: "#8e6bd7", HTML: "#d85a36", Go: "#00a6d6", Rust: "#d14a2c" };

export default function Explorer() {
  const [username, setUsername] = useState("vercel");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("updated");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function search(event?: FormEvent, handle = username) {
    event?.preventDefault();
    const cleanHandle = handle.trim().replace(/^@/, "");
    if (!cleanHandle) { setStatus("error"); setMessage("Enter a GitHub username to continue."); return; }
    setStatus("loading"); setMessage(""); setProfile(null); setRepos([]);
    try {
      const headers = { Accept: "application/vnd.github+json" };
      const [profileResponse, repoResponse] = await Promise.all([
        fetch(`https://api.github.com/users/${encodeURIComponent(cleanHandle)}`, { headers }),
        fetch(`https://api.github.com/users/${encodeURIComponent(cleanHandle)}/repos?per_page=100&type=owner`, { headers })
      ]);
      if (profileResponse.status === 404) throw new Error("No GitHub account matches that username.");
      if (!profileResponse.ok || !repoResponse.ok) throw new Error("GitHub could not complete this request. Please try again shortly.");
      setProfile(await profileResponse.json());
      setRepos((await repoResponse.json()).filter((repo: Repo) => !repo.fork));
      setUsername(cleanHandle);
      setStatus("idle");
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Something went wrong."); }
  }

  useEffect(() => { search(undefined, "vercel"); }, []);

  const visibleRepos = useMemo(() => repos.filter(repo => [repo.name, repo.description, repo.language].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "stars" ? b.stargazers_count - a.stargazers_count : sort === "name" ? a.name.localeCompare(b.name) : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()), [repos, query, sort]);

  return <main>
    <nav><a className="brand" href="#top"><span>◆</span> GitScout</a><a className="github-link" href="https://github.com" target="_blank" rel="noreferrer">github.com ↗</a></nav>
    <section className="hero" id="top"><p className="eyebrow">Open source, made legible</p><h1>Find the work<br /><em>behind the handle.</em></h1><form onSubmit={search}><label htmlFor="username">GitHub username</label><div className="searchbar"><span>@</span><input id="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="e.g. vercel" autoComplete="off" /><button disabled={status === "loading"}>{status === "loading" ? "Searching…" : "Explore"}</button></div></form><div className="quick"><span>Try</span>{["vercel", "torvalds", "gaearon"].map(handle => <button key={handle} onClick={() => search(undefined, handle)}>@{handle}</button>)}</div></section>
    {status === "error" && <section className="notice" role="alert"><strong>Couldn’t load profile.</strong><span>{message}</span></section>}
    {profile && <>
      <section className="profile"><img src={profile.avatar_url} alt="" /><div className="identity"><p className="eyebrow">Profile / @{profile.login}</p><h2>{profile.name || profile.login}</h2><p>{profile.bio || "No bio added yet."}</p><div className="details">{profile.location && <span>⌖ {profile.location}</span>}{profile.blog && <a href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`} target="_blank" rel="noreferrer">↗ Website</a>}<a href={profile.html_url} target="_blank" rel="noreferrer">View on GitHub ↗</a></div></div><dl><div><dt>Repositories</dt><dd>{profile.public_repos}</dd></div><div><dt>Followers</dt><dd>{profile.followers.toLocaleString()}</dd></div><div><dt>Following</dt><dd>{profile.following}</dd></div></dl></section>
      <section className="repositories"><header><div><p className="eyebrow">Selected output</p><h2>Repositories <small>{repos.length}</small></h2></div><div className="controls"><input aria-label="Search repositories" value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter repositories" /><select value={sort} onChange={event => setSort(event.target.value)} aria-label="Sort repositories"><option value="updated">Recently updated</option><option value="stars">Most starred</option><option value="name">Name A–Z</option></select></div></header>{visibleRepos.length ? <div className="repo-grid">{visibleRepos.map(repo => <article className="repo" key={repo.id}><div><h3><a href={repo.html_url} target="_blank" rel="noreferrer">{repo.name} ↗</a></h3><p>{repo.description || "No description provided."}</p></div><footer>{repo.language && <span><i style={{ background: languageColors[repo.language] || "#8b8176" }} />{repo.language}</span>}<span>★ {repo.stargazers_count.toLocaleString()}</span><span>⑂ {repo.forks_count.toLocaleString()}</span></footer></article>)}</div> : <div className="empty"><strong>No repositories found.</strong><p>Try a different search term.</p></div>}</section>
    </>}
  </main>;
}
