import { createServerFn } from "@tanstack/react-start";
import type { AiAction, TaskCategory } from "./app-state";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiChatResponse = {
  text: string;
  action?: AiAction;
};

function parseFallbackCommand(message: string): AiChatResponse {
  const lower = message.toLowerCase();

  // 1. Rebalance command
  if (
    lower.includes("balance") ||
    lower.includes("rebalance") ||
    lower.includes("too much") ||
    lower.includes("offload") ||
    lower.includes("overwhelmed")
  ) {
    return {
      text: "I’ve analyzed your current load. The Autonomous Workload Balancer is deferring your non-urgent errands, drafting your social decline text, and setting your capacity back to a safe 61%.",
      action: { type: "REBALANCE" },
    };
  }

  // 2. Recovery trigger
  if (lower.includes("recovery") || lower.includes("break") || lower.includes("exhausted")) {
    return {
      text: "Your load is critically high. I’m locking task creation for 15 minutes to reduce decision fatigue. Please step outside for your single-action directive.",
      action: { type: "TRIGGER_RECOVERY" },
    };
  }

  // 3. Natural Task creation (e.g. "I just got a CS301 Machine Learning assignment due Thursday, high priority, takes 6 hours")
  const courseMatch = message.match(/([A-Z]{2,4}\s?\d{3})/i);
  const hoursMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:hours|hr|hrs|h)/i);
  const dueMatch = message.match(/due\s+([A-Za-z0-9\s]+?)(?:,|$|\bfor\b|\bwith\b|\btakes\b)/i);

  if (
    hoursMatch ||
    courseMatch ||
    lower.includes("assignment") ||
    lower.includes("task") ||
    lower.includes("exam") ||
    lower.includes("project")
  ) {
    const course = courseMatch ? courseMatch[1].toUpperCase() : "ACADEMIC";
    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 4;
    const due = dueMatch ? dueMatch[1].trim() : "Thursday";
    const title = message.length < 50 ? message : `${course} Assignment`;

    let cat: TaskCategory = "mental";
    if (lower.includes("grocery") || lower.includes("clean") || lower.includes("pass") || lower.includes("errand")) {
      cat = "errands";
    } else if (lower.includes("gym") || lower.includes("run") || lower.includes("workout")) {
      cat = "physical";
    } else if (lower.includes("party") || lower.includes("club") || lower.includes("dinner")) {
      cat = "social";
    }

    return {
      text: `Got it! I’ve logged "${title}" (${course}, ${hours}h due ${due}). I’ve clocked it in as your focus, updated your 5-vector capacity gauge, and re-prioritized your matrix in real-time.`,
      action: {
        type: "ADD_TASK",
        payload: { title, course, due, hours, cat },
      },
    };
  }

  // Default natural coaching response
  return {
    text: "I’ve checked your capacity gauge. Focus on one urgent academic milestone today, let low-priority errands wait, and protect your evening for a 10-minute recovery reset.",
  };
}

export const askBalanceAI = createServerFn({ method: "POST" })
  .validator((input: { message: string; history?: ChatMessage[] }) => input)
  .handler(async ({ data }): Promise<AiChatResponse> => {
    const { config } = await import("dotenv");
    config();

    const message = (data?.message ?? "").trim();

    if (!message) {
      throw new Error("Please type or speak a message before sending it to BalanceAI.");
    }

    const apiKey = process.env.GROQ_API_KEY ?? process.env.OPENAI_API_KEY;
    const model = process.env.GROQ_MODEL ?? process.env.OPENAI_MODEL ?? "llama-3.3-70b-versatile";
    const baseUrl = (
      process.env.GROQ_BASE_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.groq.com/openai/v1"
    ).replace(/\/$/, "");

    if (!apiKey) {
      // Return smart fallback command response so local demo works without requiring API keys
      return parseFallbackCommand(message);
    }

    const history = Array.isArray(data?.history) ? data.history.slice(-8) : [];

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "You are BalanceAI, a calm student-performance coach and autonomous workload manager.\n" +
                "Help students stay productive without burning out.\n" +
                "Style rules:\n" +
                "- Write in clear, supportive plain text (no markdown bold/asterisks).\n" +
                "- Keep advice short, practical, and grounded (3-5 sentences).\n" +
                "- If the user specifies an assignment or task (e.g. 'I just got a CS301 Machine Learning assignment due Thursday, high priority, takes 6 hours'), parse it and append a single line JSON at the end: ```json {\"action\": \"ADD_TASK\", \"title\": \"...\", \"course\": \"...\", \"due\": \"...\", \"hours\": 6, \"cat\": \"mental\"} ```\n" +
                "- If the user asks to balance, rebalance, or offload: append ```json {\"action\": \"REBALANCE\"} ``` at the end.\n" +
                "- If the user is burning out or requests recovery: append ```json {\"action\": \"TRIGGER_RECOVERY\"} ``` at the end.",
            },
            ...history.map((item) => ({
              role: item.role,
              content: item.content,
            })),
            {
              role: "user",
              content: message,
            },
          ],
        }),
      });

      if (!response.ok) {
        return parseFallbackCommand(message);
      }

      const json = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string | Array<{ type?: string; text?: string }>;
          };
        }>;
      };

      const rawContent =
        typeof json.choices?.[0]?.message?.content === "string"
          ? json.choices[0].message.content
          : "";

      if (!rawContent) {
        return parseFallbackCommand(message);
      }

      // Extract optional JSON block for action
      let action: AiAction | undefined;
      const jsonBlockMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
      let cleanText = rawContent;

      if (jsonBlockMatch) {
        cleanText = rawContent.replace(jsonBlockMatch[0], "").trim();
        try {
          const parsed = JSON.parse(jsonBlockMatch[1]);
          if (parsed.action === "ADD_TASK") {
            action = {
              type: "ADD_TASK",
              payload: {
                title: parsed.title || "New Task",
                course: parsed.course || "ACADEMIC",
                due: parsed.due || "Soon",
                hours: parsed.hours || 4,
                cat: parsed.cat || "mental",
              },
            };
          } else if (parsed.action === "REBALANCE") {
            action = { type: "REBALANCE" };
          } else if (parsed.action === "TRIGGER_RECOVERY") {
            action = { type: "TRIGGER_RECOVERY" };
          }
        } catch {}
      }

      cleanText = cleanText
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(?!\s)(.+?)(?<!\s)\*/g, "$1")
        .replace(/^\s*[-*]\s+/gm, "• ")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      // If no explicit JSON action was found in text, fallback to pattern matcher for actions
      if (!action) {
        const fallback = parseFallbackCommand(message);
        action = fallback.action;
      }

      return { text: cleanText || "I've processed your update.", action };
    } catch {
      return parseFallbackCommand(message);
    }
  });

