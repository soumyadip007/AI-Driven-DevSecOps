const { chatOllama, isOllamaAvailable } = require("./ollama");

/**
 * Pluggable LLM factory.
 * Today: ollama | none
 * Later: openai | anthropic | azure — same chat({ system, user }) shape.
 */
function createLlm(options = {}) {
  const provider = (options.provider || process.env.LLM_PROVIDER || "none").toLowerCase();
  const model =
    options.model ||
    process.env.LLM_MODEL ||
    process.env.OLLAMA_MODEL ||
    "llama3";
  const baseUrl =
    options.baseUrl ||
    process.env.OLLAMA_HOST ||
    "http://127.0.0.1:11434";

  if (provider === "none" || provider === "off" || provider === "heuristic") {
    return {
      name: "none",
      model: null,
      enabled: false,
      async chat() {
        return null;
      },
    };
  }

  if (provider === "ollama") {
    return {
      name: "ollama",
      model,
      baseUrl,
      enabled: true,
      async ready() {
        return isOllamaAvailable(baseUrl);
      },
      async chat({ system, user, temperature }) {
        return chatOllama({ baseUrl, model, system, user, temperature });
      },
    };
  }

  // Stubs for future providers — keep the interface stable for the talk.
  if (provider === "openai" || provider === "anthropic") {
    return {
      name: provider,
      model,
      enabled: false,
      async chat() {
        throw new Error(
          `LLM provider "${provider}" is not wired yet. Use --llm ollama for the demo.`
        );
      },
    };
  }

  throw new Error(
    `Unknown LLM provider "${provider}". Use: ollama | none (openai/anthropic later).`
  );
}

module.exports = { createLlm };
