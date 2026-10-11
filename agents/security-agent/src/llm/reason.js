/**
 * LLM-assisted Reason / Present steps.
 * Deterministic scanners + remediation templates remain source of truth.
 * The model explains and narrates — it must not invent CVEs or finding IDs.
 */

const SYSTEM = `You are a security engineer assisting a bounded DevSecOps agent for a conference demo.
Rules:
- ONLY use findings and facts provided in the user message.
- Do NOT invent CVEs, file paths, or tools.
- Cite finding IDs exactly when you mention an issue.
- Be concise, clear, and suitable for a live audience.
- Prefer actionable security reasoning over generic advice.`;

function buildReasonPrompt({ correlation, findings, proposed }) {
  const hero = correlation.hero;
  const findingLines = findings
    .slice(0, 12)
    .map(
      (f) =>
        `- id=${f.finding_id} tool=${f.tool} category=${f.category} severity=${f.severity} file=${f.filepath || "n/a"} msg=${f.message}`
    )
    .join("\n");

  const remLines = (proposed || [])
    .map((p) => `- ${p.kind}: ${p.summary} → ${p.targetRel}`)
    .join("\n");

  return `Analyze these scanner findings and produce a short audience-ready briefing.

Deterministic hero finding (already selected by the agent — do not replace it):
- id: ${hero ? hero.finding_id : "none"}
- category: ${hero ? hero.category : "n/a"}
- heuristic_root_cause: ${correlation.root_cause_hypothesis}

All findings:
${findingLines || "(none)"}

Remediations the agent will propose (templates — already decided):
${remLines || "(none)"}

Respond in EXACTLY this Markdown structure:

## Audience briefing
(3-5 sentences: what happened, why it matters, what we will fix first)

## Why this is highest impact
(2-4 bullets citing finding IDs)

## How findings connect
(2-4 bullets correlating SAST / SCA / policy)

## What humans must still approve
(2-3 bullets — merge, residual risk, re-scan)
`;
}

async function enrichWithLlm({ llm, correlation, findings, proposed, audit }) {
  if (!llm || !llm.enabled) {
    return {
      used: false,
      provider: llm ? llm.name : "none",
      briefingMarkdown: null,
      error: null,
    };
  }

  const ready = typeof llm.ready === "function" ? await llm.ready() : true;
  if (!ready) {
    const error = `LLM provider ${llm.name} is not reachable`;
    audit.record({ phase: "reason", tool: "llm_chat", status: "unavailable", error });
    return { used: false, provider: llm.name, model: llm.model, briefingMarkdown: null, error };
  }

  try {
    audit.record({
      phase: "reason",
      tool: "llm_chat",
      status: "start",
      provider: llm.name,
      model: llm.model,
    });
    const result = await llm.chat({
      system: SYSTEM,
      user: buildReasonPrompt({ correlation, findings, proposed }),
      temperature: 0.2,
    });
    audit.record({
      phase: "reason",
      tool: "llm_chat",
      status: "ok",
      provider: result.provider,
      model: result.model,
      chars: result.text.length,
      eval_count: result.raw && result.raw.eval_count,
    });
    return {
      used: true,
      provider: result.provider,
      model: result.model,
      briefingMarkdown: result.text,
      error: null,
    };
  } catch (err) {
    audit.record({
      phase: "reason",
      tool: "llm_chat",
      status: "error",
      provider: llm.name,
      error: err.message,
    });
    return {
      used: false,
      provider: llm.name,
      model: llm.model,
      briefingMarkdown: null,
      error: err.message,
    };
  }
}

module.exports = { enrichWithLlm, buildReasonPrompt, SYSTEM };
