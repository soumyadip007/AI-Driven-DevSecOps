/**
 * Ollama provider — local OpenAI-compatible-ish chat via /api/chat
 * Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
 */

async function chatOllama({
  baseUrl = process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
  model = process.env.OLLAMA_MODEL || "llama3",
  system,
  user,
  temperature = 0.2,
  timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS || 120000),
}) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        options: { temperature },
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Ollama HTTP ${res.status}: ${body.slice(0, 400)}`);
    }

    const data = await res.json();
    const text = (data.message && data.message.content) || "";
    if (!text.trim()) {
      throw new Error("Ollama returned empty content");
    }
    return {
      provider: "ollama",
      model: data.model || model,
      text: text.trim(),
      raw: {
        total_duration: data.total_duration,
        eval_count: data.eval_count,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

async function isOllamaAvailable(baseUrl = process.env.OLLAMA_HOST || "http://127.0.0.1:11434") {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { chatOllama, isOllamaAvailable };
