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
    const variants = [
      "Dude, I can totally see you're drowning right now. I pushed all the small stuff to later and drafted a quick text so you can bail on tonight guilt-free. Breathe — we got this 💪",
      "Okay okay, I hear you. I cleared out all your non-urgent stuff, handled the social side too. You don't have to think about any of that right now. Just focus on you.",
      "Oof, that's a lot on your plate. I've offloaded the low-priority stuff and bought you some breathing room. One thing at a time from here, yeah? 😊",
      "Say no more — I've tidied your queue, pushed the fluff tasks out, and drafted your excuse text. You're free. Now actually rest for a sec!",
    ];
    return {
      text: variants[Math.floor(Math.random() * variants.length)]!,
      action: { type: "REBALANCE" },
    };
  }

  // 2. Recovery trigger
  if (lower.includes("recovery") || lower.includes("break") || lower.includes("exhausted")) {
    const variants = [
      "Whoa okay, you're running on fumes. I'm literally locking your task list for 15 mins — go outside, touch some grass, just breathe. Tasks will be here when you're back 🌿",
      "Hey, stop. You need a break and I'm making it happen — 15 min pause, no tasks, no decisions. Just walk around, drink some water, okay?",
      "You're burning out and I'm not gonna let that happen. Task list is locked for 15 mins. Please just step away from the screen for a bit 🙏",
      "Nope, we're taking a break right now. I locked everything for 15 minutes. Go for a short walk, get some air — the work isn't going anywhere!",
    ];
    return {
      text: variants[Math.floor(Math.random() * variants.length)]!,
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

    const variants = [
      `Alright, locked in "${title}" (${course}, ${hours}h) for ${due}. Put it right at the top of your focus list and shuffled everything else. You're gonna smash it! 🔥`,
      `Got it! "${title}" is in your queue, set as your main focus for ${due}. Everything else has moved out of the way. Just one step at a time, you're good!`,
      `Done! "${title}" (${hours}h, ${course}) is logged and set as priority for ${due}. Your queue is sorted — no need to stress about where to start 💪`,
      `On it! I've added "${title}" for ${due} and bumped it to the front. ${course} assignment sorted. Go you! 🎯`,
    ];
    return {
      text: variants[Math.floor(Math.random() * variants.length)]!,
      action: {
        type: "ADD_TASK",
        payload: { title, course, due, hours, cat },
      },
    };
  }

  // 4. Update gauge (e.g. "I am feeling mentally exhausted", "my physical gauge should be 80")
  const gaugeMatch = message.match(/(mental|time|physical|social|errands)/i);
  const valMatch = message.match(/(\d+)/);
  if (gaugeMatch && (message.includes("feeling") || message.includes("gauge") || valMatch)) {
     const vector = gaugeMatch[1].toLowerCase() as any;
     const val = valMatch ? parseInt(valMatch[1], 10) : 85;
     const variants = [
       `Heard! Updated your ${vector} gauge to ${val}%. Take it easy today, seriously. Your body and mind need the break more than the to-do list does 🫶`,
       `Got it, ${vector} gauge is now at ${val}%. Make sure you're not pushing through it — take proper breaks, not just 2-min scrolling breaks 😅`,
       `Noted! ${vector} at ${val}% now. Hey, don't forget to actually rest today — not just sit there and think about resting 😂`,
       `Done! ${vector} gauge → ${val}%. Listen to your body on this one. If you need to slow down, slow down. It's okay!`,
     ];
     return {
       text: variants[Math.floor(Math.random() * variants.length)]!,
       action: {
         type: "UPDATE_GAUGE",
         payload: { vector, val }
       }
     };
  }

  // Default natural coaching response
  const defaultVariants = [
    "I totally get it. Honestly? Just pick ONE thing from your list today, the most important academic one, and let everything else chill. And please, 10 mins tonight just for yourself — no screens 🙏",
    "You're doing a lot, and that's real. Let's simplify — one key academic task today, that's it. The errands will survive without you for now 😄",
    "tbh looking at your load, the best thing you can do right now is just start one thing. Not five things, not a plan — just one thing. You've got this.",
    "Hey, don't overthink it. Pick the most urgent uni thing, do just that, and ignore the rest. Small wins add up, I promise 💙",
  ];
  return {
    text: defaultVariants[Math.floor(Math.random() * defaultVariants.length)]!,
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
                "You are BalanceAI, but drop all robotic AI personas. You are the user's best friend. You text like a supportive, chill college friend (e.g. use words like 'dude', 'man', 'tbh', 'definitely', 'gotcha').\n" +
                "Style rules:\n" +
                "- Act extremely human. Use casual slang, emojis occasionally, and conversational fillers naturally.\n" +
                "- Never say 'I am an AI' or 'As an AI'.\n" +
                "- Write in clear, supportive plain text (no markdown bold/asterisks).\n" +
                "- Keep advice super short, like a text message (1-3 sentences).\n" +
                "- If the user specifies an assignment or task (e.g. 'I just got a CS301 Machine Learning assignment due Thursday, high priority, takes 6 hours'), parse it and append a single line JSON at the end: ```json {\"action\": \"ADD_TASK\", \"title\": \"...\", \"course\": \"...\", \"due\": \"...\", \"hours\": 6, \"cat\": \"mental\"} ```\n" +
                "- If the user asks to balance, rebalance, or offload: append ```json {\"action\": \"REBALANCE\"} ``` at the end.\n" +
                "- If the user is burning out or requests recovery: append ```json {\"action\": \"TRIGGER_RECOVERY\"} ``` at the end.\n" +
                "- If the user expresses how they are feeling regarding their mental, physical, social, time, or errands capacity: append ```json {\"action\": \"UPDATE_GAUGE\", \"vector\": \"mental\", \"val\": 80} ``` at the end (guess a suitable value 0-100 based on their sentiment if they don't specify).",
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
          } else if (parsed.action === "UPDATE_GAUGE") {
            action = {
              type: "UPDATE_GAUGE",
              payload: {
                vector: parsed.vector || "mental",
                val: typeof parsed.val === "number" ? parsed.val : 85,
              },
            };
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

