import { NextResponse } from "next/server";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const languages = new Set(["JavaScript", "TypeScript", "Python", "Java"]);

function normalise(content) {
  const clean = String(content || "").replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const review = JSON.parse(clean);
    const findings = Array.isArray(review.findings) ? review.findings.slice(0, 5) : [];
    return { summary: String(review.summary || "The model did not provide a summary."), findings: findings.length ? findings.map((item) => ({ kind: ["BUG", "RISK", "NOTE", "CHECK"].includes(item.kind) ? item.kind : "NOTE", problem: String(item.problem || "Review note"), cause: String(item.cause || "No cause was provided."), fix: String(item.fix || "No change is required."), explanation: String(item.explanation || "") })) : [{ kind: "CHECK", problem: "No issue identified", cause: "The model did not identify a specific defect.", fix: "Add focused tests for normal and edge-case inputs.", explanation: "Static analysis cannot prove runtime behavior." }] };
  } catch {
    return { summary: clean || "The model returned an empty analysis.", findings: [{ kind: "NOTE", problem: "AI review", cause: "The model returned a non-structured response.", fix: "Review the explanation above and test the code with representative inputs.", explanation: "The response is shown without inventing a structured finding." }] };
  }
}

export async function POST(request) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI is not configured. Add NVIDIA_API_KEY to .env.local and restart the app." }, { status: 503 });
  try {
    const { code, language } = await request.json();
    if (typeof code !== "string" || !code.trim()) return NextResponse.json({ error: "Paste code before requesting an analysis." }, { status: 400 });
    if (!languages.has(language)) return NextResponse.json({ error: "Choose a supported language." }, { status: 400 });
    if (code.length > 24000) return NextResponse.json({ error: "Keep the snippet under 24,000 characters." }, { status: 400 });
    const response = await fetch(NVIDIA_URL, { method: "POST", signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "deepseek-ai/deepseek-v4-flash-0731", temperature: 0.1, top_p: 0.9, max_tokens: 700, messages: [{ role: "system", content: "You are a precise senior code reviewer. Do not execute code. Return valid JSON only: {\\\"summary\\\":string,\\\"findings\\\":[{\\\"kind\\\":\\\"BUG|RISK|NOTE|CHECK\\\",\\\"problem\\\":string,\\\"cause\\\":string,\\\"fix\\\":string,\\\"explanation\\\":string}]}. Be concise: a two-sentence summary and at most three findings. Explain only what the supplied code supports. Report real issues only; if none, return one CHECK finding." }, { role: "user", content: `Review this ${language} snippet:\n\n${code}` }], extra_body: { chat_template_kwargs: { thinking: false } } }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "The NVIDIA model request failed." }, { status: response.status });
    return NextResponse.json(normalise(payload?.choices?.[0]?.message?.content));
  } catch (error) {
    if (error?.name === "TimeoutError") return NextResponse.json({ error: "The AI reviewer took longer than 15 seconds. Please try again." }, { status: 504 });
    return NextResponse.json({ error: "Could not contact the AI review service. Check your connection and try again." }, { status: 502 });
  }
}
