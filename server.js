const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {}
  return { buckets: ["OSS", "BSS", "Billing", "Contracts", "Network Engineering", "Cloud", "Project Management"], resumes: [], searchHistory: [] };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/api/data", (req, res) => res.json(loadData()));

app.post("/api/data", (req, res) => {
  const current = loadData();
  const { buckets, resumes, searchHistory } = req.body;
  if (buckets !== undefined) current.buckets = buckets;
  if (resumes !== undefined) current.resumes = resumes;
  if (searchHistory !== undefined) current.searchHistory = searchHistory;
  saveData(current);
  res.json({ ok: true });
});

// Auto-categorise a resume into suggested buckets
app.post("/api/categorise", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  const { resumeText, buckets } = req.body;
  const prompt = `You are a talent categorisation specialist. Read this resume and suggest which of the following domain buckets it belongs to. A candidate can belong to multiple buckets if genuinely relevant.

Available buckets: ${buckets.join(", ")}

Resume:
${resumeText.slice(0, 3000)}

Respond ONLY with valid JSON, no markdown:
{
  "candidateName": "full name from resume or 'Unknown'",
  "suggestedBuckets": ["<bucket1>", "<bucket2>"],
  "primaryDomain": "<one sentence summary of candidate's primary domain>"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 300, messages: [{ role: "user", content: prompt }] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: "Anthropic API error", detail: data });
    const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Categorisation failed", detail: err.message });
  }
});

// Score a single resume against a JD
app.post("/api/score", async (req, res) => {
  if (!API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
  const { resumeText, jd, jobTitle } = req.body;
  const prompt = `You are a senior talent acquisition specialist. Evaluate this resume against the job description.

JOB TITLE: ${jobTitle || "Not specified"}
JOB DESCRIPTION: ${jd}

RESUME:
${resumeText.slice(0, 4000)}

Respond ONLY with valid JSON, no markdown:
{
  "totalScore": <integer 0-100>,
  "breakdown": {
    "skillsMatch": {"score": <integer 0-25>, "notes": "<one sentence>"},
    "experienceRelevance": {"score": <integer 0-25>, "notes": "<one sentence>"},
    "domainFit": {"score": <integer 0-25>, "notes": "<one sentence>"},
    "seniorityAlignment": {"score": <integer 0-25>, "notes": "<one sentence>"}
  },
  "strengths": ["<point 1>", "<point 2>", "<point 3>"],
  "gaps": ["<gap 1>", "<gap 2>"],
  "recommendation": "<exactly one of: Strong Hire | Hire | Maybe | No Hire>"
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: "Anthropic API error", detail: data });
    const raw = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Scoring failed", detail: err.message });
  }
});

app.listen(PORT, () => console.log(`TA Screener v2 running on port ${PORT}`));
