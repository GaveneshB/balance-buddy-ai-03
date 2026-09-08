import { createServerFn } from "@tanstack/react-start";
import type { AiAction, TaskCategory } from "./app-state";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiChatResponse = {
  text: string;
  action?: AiAction | undefined;
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
    const course = courseMatch?.[1] ? courseMatch[1].toUpperCase() : "ACADEMIC";
    const hours = hoursMatch?.[1] ? parseFloat(hoursMatch[1]) : 4;
    const due = dueMatch?.[1] ? dueMatch[1].trim() : "Thursday";
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

    const apiKey = process.env["GROQ_API_KEY"] ?? process.env["OPENAI_API_KEY"];
    const model = process.env["GROQ_MODEL"] ?? process.env["OPENAI_MODEL"] ?? "openai/gpt-oss-120b";
    const baseUrl = (
      process.env["GROQ_BASE_URL"] ?? process.env["OPENAI_BASE_URL"] ?? "https://api.groq.com/openai/v1"
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

      if (jsonBlockMatch?.[1]) {
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

export type MicroStep = {
  id: string;
  title: string;
  minutes: number;
  completed?: boolean | undefined;
};

export type DeconstructTaskResponse = {
  taskTitle: string;
  steps: MicroStep[];
};

function generateFallbackSteps(taskTitle: string): MicroStep[] {
  const clean = taskTitle.replace(/assignment|project|exam|study/gi, "").trim() || "Assignment";
  return [
    {
      id: "step-1",
      title: `Open workspace & inspect required specs for ${clean}`,
      minutes: 10,
    },
    {
      id: "step-2",
      title: `Set up boilerplate, starter notes, and initial outline`,
      minutes: 15,
    },
    {
      id: "step-3",
      title: `Complete primary core problem or central section`,
      minutes: 20,
    },
    {
      id: "step-4",
      title: `Run test checks, verify criteria, and package work`,
      minutes: 15,
    },
  ];
}

export const deconstructTaskAI = createServerFn({ method: "POST" })
  .validator(
    (input: {
      taskTitle: string;
      course?: string | undefined;
      hours?: number | undefined;
    }) => input,
  )
  .handler(async ({ data }): Promise<DeconstructTaskResponse> => {
    const { config } = await import("dotenv");
    config();

    const title = (data?.taskTitle ?? "").trim();
    if (!title) {
      return { taskTitle: "Task", steps: generateFallbackSteps("Task") };
    }

    const apiKey = process.env["GROQ_API_KEY"] ?? process.env["OPENAI_API_KEY"];
    const model = process.env["GROQ_MODEL"] ?? process.env["OPENAI_MODEL"] ?? "openai/gpt-oss-120b";
    const baseUrl = (
      process.env["GROQ_BASE_URL"] ?? process.env["OPENAI_BASE_URL"] ?? "https://api.groq.com/openai/v1"
    ).replace(/\/$/, "");

    if (!apiKey) {
      return { taskTitle: title, steps: generateFallbackSteps(title) };
    }

    try {
      const prompt = `Deconstruct this student task into 3-4 gentle, non-intimidating 10-to-20 minute micro-steps: "${title}" (Course: ${data.course ?? "Academic"}, Est. hours: ${data.hours ?? 3}h).
Return ONLY a valid JSON array of objects with keys "title" (actionable plain text string, max 10 words) and "minutes" (number 10-20). Do not include any explanations.`;

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content:
                "You are an expert ADHD executive-dysfunction coach. Deconstruct intimidating tasks into tiny, bite-sized 10-20 minute micro-steps. Return ONLY a valid JSON array.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        return { taskTitle: title, steps: generateFallbackSteps(title) };
      }

      const json = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      const raw = json.choices?.[0]?.message?.content ?? "";
      const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch?.[0]) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{ title?: string; minutes?: number }>;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const steps: MicroStep[] = parsed.slice(0, 5).map((item, idx) => ({
            id: `ms-${idx + 1}-${Date.now()}`,
            title: item.title || `Micro-step ${idx + 1}`,
            minutes: Number(item.minutes) || 15,
          }));
          return { taskTitle: title, steps };
        }
      }

      return { taskTitle: title, steps: generateFallbackSteps(title) };
    } catch {
      return { taskTitle: title, steps: generateFallbackSteps(title) };
    }
  });

export const downsizeStepAI = createServerFn({ method: "POST" })
  .validator((input: { stepTitle: string }) => input)
  .handler(async ({ data }): Promise<{ downsizedTitle: string; minutes: number }> => {
    const original = (data?.stepTitle ?? "").trim();
    if (!original) {
      return {
        downsizedTitle: "Just open your file and write 1 line or comment (2 min)",
        minutes: 2,
      };
    }

    const { config } = await import("dotenv");
    config();

    const apiKey = process.env["GROQ_API_KEY"] ?? process.env["OPENAI_API_KEY"];
    const model = process.env["GROQ_MODEL"] ?? process.env["OPENAI_MODEL"] ?? "openai/gpt-oss-120b";
    const baseUrl = (
      process.env["GROQ_BASE_URL"] ?? process.env["OPENAI_BASE_URL"] ?? "https://api.groq.com/openai/v1"
    ).replace(/\/$/, "");

    if (!apiKey) {
      return {
        downsizedTitle: `Just open your workspace and read the first sentence of: "${original}"`,
        minutes: 2,
      };
    }

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content:
                "You are an ADHD executive coach helping a student unfreeze from task paralysis. Downsize the given step into an effortless, single 2-minute starter action. Respond with just 1 sentence.",
            },
            {
              role: "user",
              content: `The student is paralyzed trying to do: "${original}". Give them a frictionless 2-minute starter step.`,
            },
          ],
        }),
      });

      if (!response.ok) {
        return {
          downsizedTitle: `Just open your workspace and type 1 comment for: ${original}`,
          minutes: 2,
        };
      }

      const json = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim() || "";
      return {
        downsizedTitle: text || `Just open your file and read 1 sentence of: ${original}`,
        minutes: 2,
      };
    } catch {
      return {
        downsizedTitle: `Just open your workspace and type 1 comment for: ${original}`,
        minutes: 2,
      };
    }
  });

