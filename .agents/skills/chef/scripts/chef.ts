/**
 * Chef - Blocking Telegram Q&A for AI agents
 *
 * ALL methods are BLOCKING (except notify).
 *
 * Usage:
 *   import { chef } from "./skills/chef/scripts/chef.ts";
 *
 *   const text = await chef.ask("Name?");
 *   const ok = await chef.confirm("Proceed?");
 *   const idx = await chef.choice("Pick:", ["A", "B", "C"]);
 *   await chef.notify("Done!");
 *
 * Setup: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
 */

const API = "https://api.telegram.org/bot";

interface Update {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
  callback_query?: { id: string; data?: string; message?: { message_id: number; chat: { id: number } } };
}

async function loadEnv() {
  const locations: string[] = [];
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    locations.push(`${dir}/.env.local`, `${dir}/.env`);
    const parent = dir.replace(/\/[^/]+$/, "");
    if (parent === dir) break;
    dir = parent;
  }

  for (const path of locations) {
    try {
      const file = Bun.file(path);
      if (await file.exists()) {
        const content = await file.text();
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eq = trimmed.indexOf("=");
          if (eq > 0) {
            const key = trimmed.slice(0, eq).trim();
            let val = trimmed.slice(eq + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
        break;
      }
    } catch {}
  }
}

class ChefError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "ChefError";
  }
}

function getConfig() {
  const token = Bun.env.TELEGRAM_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
  const chatIdStr = Bun.env.TELEGRAM_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;

  if (!token || token.trim() === "") {
    throw new ChefError("TELEGRAM_BOT_TOKEN not found or empty. Set in .env", "MISSING_TOKEN");
  }
  if (!chatIdStr || chatIdStr.trim() === "") {
    throw new ChefError("TELEGRAM_CHAT_ID not found or empty. Set in .env", "MISSING_CHAT_ID");
  }

  const chatId = parseInt(chatIdStr.trim(), 10);
  if (isNaN(chatId)) {
    throw new ChefError(`TELEGRAM_CHAT_ID must be a number, got: "${chatIdStr}"`, "INVALID_CHAT_ID");
  }

  return { api: `${API}${token.trim()}`, chatId };
}

await loadEnv();

async function call<T>(api: string, method: string, body?: object): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${api}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ChefError(`Network error: ${err instanceof Error ? err.message : "fetch failed"}`, "NETWORK_ERROR");
  }

  if (!res.ok) {
    throw new ChefError(`HTTP ${res.status}: ${res.statusText}`, "HTTP_ERROR");
  }

  let json: { ok: boolean; result?: T; description?: string };
  try {
    json = await res.json();
  } catch {
    throw new ChefError("Invalid JSON response from Telegram API", "PARSE_ERROR");
  }

  if (!json.ok) {
    throw new ChefError(json.description ?? "Telegram API error", "API_ERROR");
  }

  return json.result as T;
}

interface ChoiceOptions {
  cols?: number;
  timeout?: number;
}

class ChefClient {
  private cfg = getConfig();
  private offset = 0;
  private initialized = false;

  private async init(): Promise<void> {
    if (this.initialized) return;
    const updates = await call<Update[]>(this.cfg.api, "getUpdates", {
      offset: -1,
      limit: 1,
    });
    if (updates.length > 0) {
      this.offset = updates[0].update_id;
    }
    this.initialized = true;
  }

  private async send(text: string, keyboard?: object): Promise<number> {
    const result = await call<{ message_id: number }>(this.cfg.api, "sendMessage", {
      chat_id: this.cfg.chatId,
      text,
      parse_mode: "Markdown",
      ...(keyboard && { reply_markup: keyboard }),
    });
    return result.message_id;
  }

  private async editMessage(messageId: number, text: string): Promise<void> {
    try {
      await call(this.cfg.api, "editMessageText", {
        chat_id: this.cfg.chatId,
        message_id: messageId,
        text,
        reply_markup: { inline_keyboard: [] },
      });
    } catch {}
  }

  private async poll(): Promise<Update[]> {
    await this.init();
    const updates = await call<Update[]>(this.cfg.api, "getUpdates", {
      offset: this.offset + 1,
      timeout: 30,
      allowed_updates: ["message", "callback_query"],
    });
    for (const u of updates) this.offset = u.update_id;
    return updates;
  }

  private async ackCallback(callbackId: string): Promise<void> {
    try {
      await call(this.cfg.api, "answerCallbackQuery", { callback_query_id: callbackId });
    } catch {}
  }

  private indexToLetter(i: number): string {
    return String.fromCharCode(65 + i);
  }

  private letterToIndex(letter: string): number {
    const upper = letter.toUpperCase();
    if (upper.length === 1 && upper >= "A" && upper <= "Z") {
      return upper.charCodeAt(0) - 65;
    }
    return -1;
  }

  /** Free text question - BLOCKING */
  async ask(question: string, timeoutMs: number = 600000): Promise<string | null> {
    if (!question || question.trim() === "") {
      throw new ChefError("question cannot be empty", "EMPTY_QUESTION");
    }

    await this.init();
    const msgId = await this.send(question);
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      for (const u of await this.poll()) {
        if (u.message?.chat.id === this.cfg.chatId && u.message.text) {
          await this.editMessage(msgId, `${question}\n\n✅`);
          return u.message.text;
        }
      }
    }
    return null;
  }

  /** Yes/No question - BLOCKING */
  async confirm(question: string, timeoutMs: number = 600000): Promise<boolean | null> {
    if (!question || question.trim() === "") {
      throw new ChefError("question cannot be empty", "EMPTY_QUESTION");
    }

    await this.init();
    const kb = { inline_keyboard: [[
      { text: "✅ Yes", callback_data: "y" },
      { text: "❌ No", callback_data: "n" },
    ]]};
    const msgId = await this.send(question, kb);
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      for (const u of await this.poll()) {
        if (u.callback_query?.message?.chat.id === this.cfg.chatId &&
            u.callback_query.message.message_id === msgId) {
          const d = u.callback_query.data;
          if (d === "y" || d === "n") {
            await this.ackCallback(u.callback_query.id);
            await this.editMessage(msgId, `${question}\n\n✅ ${d === "y" ? "Yes" : "No"}`);
            return d === "y";
          }
        }
        if (u.message?.chat.id === this.cfg.chatId && u.message.text) {
          const txt = u.message.text.toLowerCase().trim();
          if (["yes", "y", "1", "ok"].includes(txt)) {
            await this.editMessage(msgId, `${question}\n\n✅ Yes`);
            return true;
          }
          if (["no", "n", "0"].includes(txt)) {
            await this.editMessage(msgId, `${question}\n\n✅ No`);
            return false;
          }
        }
      }
    }
    return null;
  }

  /** Multiple choice question - BLOCKING */
  async choice(question: string, options: string[], opts: ChoiceOptions = {}): Promise<number | null> {
    const { cols = 4, timeout = 600000 } = opts;
    
    if (!options || options.length === 0) {
      throw new ChefError("choice() requires at least one option", "INVALID_OPTIONS");
    }
    if (options.length > 26) {
      throw new ChefError("choice() supports max 26 options (A-Z)", "TOO_MANY_OPTIONS");
    }
    if (!question || question.trim() === "") {
      throw new ChefError("question cannot be empty", "EMPTY_QUESTION");
    }

    await this.init();

    const optionsList = options.map((o, i) => `  ${this.indexToLetter(i)}) ${o}`).join("\n");
    const hint = `💡 _Tap a button or type ${options.length > 1 ? `A-${this.indexToLetter(options.length - 1)}` : "A"}_`;
    const fullQuestion = `${question}\n\n${optionsList}\n\n${hint}`;

    const buttons = options.map((_, i) => ({ text: this.indexToLetter(i), callback_data: `${i}` }));
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < buttons.length; i += cols) {
      rows.push(buttons.slice(i, i + cols));
    }

    const msgId = await this.send(fullQuestion, { inline_keyboard: rows });
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      for (const u of await this.poll()) {
        if (u.callback_query?.message?.chat.id === this.cfg.chatId &&
            u.callback_query.message.message_id === msgId) {
          const idx = parseInt(u.callback_query.data ?? "");
          if (idx >= 0 && idx < options.length) {
            await this.ackCallback(u.callback_query.id);
            await this.editMessage(msgId, `${question}\n\n✅ ${this.indexToLetter(idx)}) ${options[idx]}`);
            return idx;
          }
        }
        if (u.message?.chat.id === this.cfg.chatId && u.message.text) {
          const txt = u.message.text.trim();
          const idx = this.letterToIndex(txt);
          if (idx >= 0 && idx < options.length) {
            await this.editMessage(msgId, `${question}\n\n✅ ${this.indexToLetter(idx)}) ${options[idx]}`);
            return idx;
          }
        }
      }
    }
    return null;
  }

  /** Collect multiple responses until stopword - BLOCKING */
  async collect(question: string, stopword: string = "lfg", timeoutMs: number = 600000, graceMs: number = 30000): Promise<{ responses: string[]; stopped: boolean; timedOut: boolean }> {
    if (!question || question.trim() === "") {
      throw new ChefError("question cannot be empty", "EMPTY_QUESTION");
    }

    await this.init();
    const responses: string[] = [];
    const stopLower = stopword.toLowerCase();
    let deadline = Date.now() + timeoutMs;
    
    await this.send(`${question}\n\n💡 _Type "${stopword.toUpperCase()}" when done_`);

    while (Date.now() < deadline) {
      for (const u of await this.poll()) {
        if (u.message?.chat.id === this.cfg.chatId && u.message.text) {
          const txt = u.message.text.trim();
          if (txt.toLowerCase() === stopLower) {
            return { responses, stopped: true, timedOut: false };
          }
          responses.push(txt);
          deadline = Date.now() + graceMs;
          await this.send(`📝 Got it! Keep going or "${stopword.toUpperCase()}" to finish`);
        }
      }
    }
    return { responses, stopped: false, timedOut: true };
  }

  /** Fire & forget notification */
  async notify(message: string): Promise<void> {
    if (!message || message.trim() === "") {
      throw new ChefError("message cannot be empty", "EMPTY_MESSAGE");
    }

    await this.send(message);
  }
}

export const chef = new ChefClient();
export { ChefClient, ChefError };

if (import.meta.main) {
  console.log("Chef - Blocking Telegram Q&A for user interviews\n");
  console.log("ALL methods are BLOCKING (except notify).\n");
  console.log("API:");
  console.log("  chef.ask(q, timeout?)                     → string|null");
  console.log("  chef.confirm(q, timeout?)                 → boolean|null");
  console.log("  chef.choice(q, opts, {cols,timeout})      → index|null");
  console.log("  chef.collect(q, stopword?, timeout?)      → {responses[], stopped, timedOut}");
  console.log("  chef.notify(msg)                          → void (fire & forget)");
}
