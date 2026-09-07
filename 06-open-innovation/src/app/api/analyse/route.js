import { NextResponse } from "next/server";

const endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";

export async function POST(request) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI analysis is not configured. Add NVIDIA_API_KEY to .env.local and restart the app." }, { status: 503 });
  try {
    const { title, description, category } = await request.json();
    if (![title, description, category].every((value) => typeof value === "string" && value.trim())) return NextResponse.json({ error: "Add a title, category, and description before requesting analysis." }, { status: 400 });
    const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "deepseek-ai/deepseek-v4-flash-0731", temperature: 0.35, max_tokens: 1000, messages: [{ role: "system", content: "You are an innovation analyst. Return valid JSON only: {\\\"summary\\\":string,\\\"solutions\\\":[string],\\\"difficulty\\\":string,\\\"technology\\\":[string],\\\"risks\\\":[string],\\\"users\\\":[string]}. Be practical, concise, and do not claim research you did not perform." }, { role: "user", content: `Analyse this ${category} proposal. Title: ${title}. Description: ${description}` }], extra_body: { chat_template_kwargs: { thinking: true, reasoning_effort: "high" } } }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "The AI request failed." }, { status: response.status });
    const raw = String(payload?.choices?.[0]?.message?.content || "").replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    try { return NextResponse.json(JSON.parse(raw)); } catch { return NextResponse.json({ error: "The model returned an unreadable analysis. Please try again." }, { status: 502 }); }
  } catch { return NextResponse.json({ error: "Could not contact the AI service. Please try again." }, { status: 502 }); }
}
