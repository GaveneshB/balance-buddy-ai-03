import { createServerFn } from "@tanstack/react-start";
import type { AiAction, MicroStep, TaskCategory, VectorKey } from "./app-state";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AiChatResponse = {
  text: string;
  action?: AiAction | undefined;
};

export type AgentId = "task" | "wellbeing";
export type ChatMode = "both" | AgentId;

export type AgentChatResponse = {
  agent: AgentId;
  text: string;
  action?: AiAction | undefined;
};

export type MultiAgentChatResponse = {
  responses: AgentChatResponse[];
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
    const titleMatch = message.match(/(?:create|add|got|received|have|need)\s+(?:a|an|the)?\s*(.*?)(?=\s+due\b|\s+takes?\b|,|$)/i);
    const title = titleMatch?.[1]?.trim() || (message.length < 70 ? message : `${course} Assignment`);
    const requestedStepsMatch = lower.match(/\b(\d{1,2})\s*(?:steps?|parts?)\b/) ?? lower.match(/(?:maybe|around|like)\s+(\d{1,2})\b/);
    const requestedSteps = requestedStepsMatch ? Number(requestedStepsMatch[1]) : 4;

    if (requestedSteps > 10) {
      return {
        text: `I can make up to 10 steps. For more than that, tell me which parts of “${title}” need their own detailed breakdown, and I’ll tailor the plan around those sections.`,
      };
    }

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
        type: "PROPOSE_TASK",
        payload: { title, course, due, hours, cat, microSteps: fallbackSteps(title, Math.max(2, requestedSteps)) },
      },
    };
  }

  // 4. Update gauge (e.g. "I am feeling mentally exhausted", "my physical gauge should be 80")
  const gaugeMatch = message.match(/(mental|time|physical|social|errands)/i);
  const valMatch = message.match(/(\d+)/);
  if (gaugeMatch && (message.includes("feeling") || message.includes("gauge") || valMatch)) {
     const vector = (gaugeMatch[1] ?? "mental").toLowerCase() as VectorKey;
     const val = valMatch?.[1] ? parseInt(valMatch[1], 10) : 85;
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

function fallbackSteps(title: string, count = 4, minutes = 15): MicroStep[] {
  const templates = [
    `Open the brief and identify what ${title} requires`,
    "Gather the materials, references, and examples you need",
    "Complete the smallest meaningful part of the work",
    "Review the result and prepare the final submission",
    "Polish one section and check it against the requirements",
    "Do a final quality check and note anything still missing",
    "Submit or share the finished work",
    "Take a moment to record what you completed",
    "Double-check the final details against the rubric",
    "Write a short reflection on the work you finished",
  ];
  return templates.slice(0, Math.max(2, Math.min(10, count))).map((step, index) => ({
    id: `draft-step-${index + 1}`,
    title: step,
    minutes: Math.max(5, Math.min(30, minutes)),
  }));
}

function reviseFallbackCommand(message: string, draft: Extract<AiAction, { type: "PROPOSE_TASK" }>['payload']): AiChatResponse {
  const lower = message.toLowerCase();
  const countMatch = lower.match(/\b(\d{1,2})\s*(?:steps?|parts?)\b/) ?? lower.match(/(?:maybe|around|like)\s+(\d{1,2})\b/);
  const minutesMatch = lower.match(/\b(5|10|15|20|25|30)\s*(?:minutes?|mins?)\b/);
  const requestedCount = countMatch ? Number(countMatch[1]) : draft.microSteps.length;
  if (requestedCount > 10) {
    return {
      text: `I can make up to 10 steps. For more than that, tell me which parts of the assignment need their own detailed breakdown, and I’ll tailor the plan around those sections.`,
    };
  }
  const count = Math.max(2, requestedCount);
  const minutes = minutesMatch ? Number(minutesMatch[1]) : lower.includes("easier") || lower.includes("smaller") ? 10 : draft.microSteps[0]?.minutes ?? 15;
  const stepEdit = lower.match(/(?:change|rewrite|replace)\s+step\s+(\d+)\s+(?:to|as)\s+(.+)/i);
  const steps = fallbackSteps(draft.title, count, minutes).map((step, index) => {
    if (stepEdit && Number(stepEdit[1]) === index + 1) {
      return { ...step, title: stepEdit[2]!.trim() };
    }
    return step;
  });
  return {
    text: `I revised the breakdown to ${steps.length} ${minutes}-minute steps. Does this feel manageable, or should I change anything else?`,
    action: { type: "PROPOSE_TASK", payload: { ...draft, microSteps: steps } },
  };
}

export const askBalanceAI = createServerFn({ method: "POST" })
  .validator((input: { message: string; history?: ChatMessage[] | undefined; draft?: Extract<AiAction, { type: "PROPOSE_TASK" }>['payload'] | undefined }) => input)
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
      return data?.draft ? reviseFallbackCommand(message, data.draft) : parseFallbackCommand(message);
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
                "- If the user specifies an assignment or task, do not create it yet. Parse it and append JSON: {\"action\": \"PROPOSE_TASK\", \"title\": \"...\", \"course\": \"...\", \"due\": \"...\", \"hours\": 6, \"cat\": \"mental\", \"microSteps\": [{\"title\": \"...\", \"minutes\": 15}]} Use a sensible number of steps from 2 to 10 based on complexity, and ask for feedback.\n" +
                "- If the user is revising the proposed breakdown, return the complete revised PROPOSE_TASK JSON with all task fields and microSteps. Use the exact number requested when it is 2-10. If they request more than 10, ask which assignment sections need extra detail instead of generating more steps.\n" +
                "- If the user asks to balance, rebalance, or offload: append ```json {\"action\": \"REBALANCE\"} ``` at the end.\n" +
                "- If the user is burning out or requests recovery: append ```json {\"action\": \"TRIGGER_RECOVERY\"} ``` at the end.\n" +
                "- If the user expresses how they are feeling regarding their mental, physical, social, time, or errands capacity: append ```json {\"action\": \"UPDATE_GAUGE\", \"vector\": \"mental\", \"val\": 80} ``` at the end (guess a suitable value 0-100 based on their sentiment if they don't specify).",
            },
            ...(data?.draft
              ? [
                  {
                    role: "system" as const,
                    content: `The current task draft is ${JSON.stringify(data.draft)}. Treat the user's next message as feedback on this draft and return the complete revised PROPOSE_TASK JSON.`,
                  },
                ]
              : []),
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
        return data?.draft ? reviseFallbackCommand(message, data.draft) : parseFallbackCommand(message);
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
        return data?.draft ? reviseFallbackCommand(message, data.draft) : parseFallbackCommand(message);
      }

      // Extract optional JSON block for action
      let action: AiAction | undefined;
      const fencedJsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/i);
      const bareJsonMatch = fencedJsonMatch ? null : rawContent.match(/\{[\s\S]*\}/);
      const jsonContent = fencedJsonMatch?.[1] ?? bareJsonMatch?.[0];
      let cleanText = jsonContent
        ? rawContent.replace(fencedJsonMatch?.[0] ?? bareJsonMatch?.[0] ?? "", "").trim()
        : rawContent;

      if (jsonContent) {
        try {
          const parsed = JSON.parse(jsonContent);
          if (parsed.action === "PROPOSE_TASK" || parsed.action === "ADD_TASK") {
            action = {
              type: "PROPOSE_TASK",
              payload: {
                title: parsed.title || "New Task",
                course: parsed.course || "ACADEMIC",
                due: parsed.due || "Soon",
                hours: parsed.hours || 4,
                cat: parsed.cat || "mental",
                microSteps: Array.isArray(parsed.microSteps) && parsed.microSteps.length > 0
                  ? parsed.microSteps.slice(0, 10).map((step: { title?: string; minutes?: number }, index: number) => ({
                      id: `draft-step-${index + 1}`,
                      title: step.title || `Micro-step ${index + 1}`,
                      minutes: Math.max(5, Math.min(30, Number(step.minutes) || 15)),
                    }))
                  : fallbackSteps(parsed.title || "this task"),
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
        const fallback = data?.draft ? reviseFallbackCommand(message, data.draft) : parseFallbackCommand(message);
        if (data?.draft && !cleanText.trim()) {
          cleanText = fallback.text;
        }
        action = fallback.action;
      }

      return { text: cleanText || "I've processed your update.", action };
    } catch {
      return data?.draft ? reviseFallbackCommand(message, data.draft) : parseFallbackCommand(message);
    }
  });

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

function isTaskCreationIntent(message: string): boolean {
  const lower = message.toLowerCase();
  const hasAction = /\b(create|make|add|generate|build|draft|plan|break down|breakdown|schedule|give me|set up|start)\b/i.test(lower);
  const hasTask = /\b(task|tasks|assignment|assignments|todo|to-do|todos|homework|project|microstep|steps|deadline)\b/i.test(lower);
  const hasTaskLogging = /\b(due\b|priority\b|\d+\s*hours?|\d+\s*h\b)/i.test(lower) && /\b(assignment|task|exam|project)\b/i.test(lower);
  const hasFeeling = /\b(feel|feeling|tired|exhaust|stress|burnout|overwhelm|anxious|heavy|pause|break)\b/i.test(lower);
  return ((hasAction && hasTask) || hasTaskLogging) && !hasFeeling;
}

function wellbeingFallback(message: string, mode: ChatMode = "wellbeing"): AgentChatResponse {
  const lower = message.toLowerCase();
  if (lower.includes("suicid") || lower.includes("kill myself") || lower.includes("hurt myself")) {
    return {
      agent: "wellbeing",
      text: "I’m really sorry you’re carrying this right now. Please contact local emergency services or a crisis line, and tell someone you trust immediately so you’re not alone with this.",
    };
  }
  if (lower.includes("break") || lower.includes("exhausted") || lower.includes("burnout")) {
    return {
      agent: "wellbeing",
      text: "That sounds like your system is asking for a real pause, not more pressure. Let’s take one small reset first—water, a slower breath, and a few minutes away from the screen.",
      action: { type: "TRIGGER_RECOVERY" },
    };
  }
  if (isTaskCreationIntent(message)) {
    if (mode === "both") {
      return {
        agent: "wellbeing",
        text: "Taking on new assignments can be demanding on your energy. The Task Agent is handling the plan and breakdown for you—remember to pace yourself, stay hydrated, and take breaks between focus blocks!",
      };
    }
    return {
      agent: "wellbeing",
      text: "Task creation and assignment planning are handled exclusively by the Task Agent. Please switch to the Task Agent (or Both Agents) tab above to create and break down this task! I'm here to support your wellbeing, stress levels, and capacity—how are you feeling about taking on this workload?",
    };
  }
  return {
    agent: "wellbeing",
    text: "I hear you. What feels heaviest right now—the emotion itself, the amount on your plate, or not knowing where to start? We can take it one piece at a time.",
  };
}

function taskFallback(message: string, taskDraft?: Extract<AiAction, { type: "PROPOSE_TASK" }>["payload"] | undefined): AgentChatResponse {
  const lower = message.toLowerCase();
  const taskIntent = /assignment|task|exam|project|course|step|breakdown|deadline|due|study/.test(lower);
  if (!taskIntent) {
    return {
      agent: "task",
      text: taskDraft ? "I’ll keep the task draft ready while you focus on what you’re feeling." : "I can help turn an assignment or responsibility into a clear, manageable plan.",
    };
  }
  return taskDraft ? { agent: "task", ...reviseFallbackCommand(message, taskDraft) } : { agent: "task", ...parseFallbackCommand(message) };
}

function parseAgentJson(rawContent: string, agent: AgentId, userMessage: string = "", mode: ChatMode = "both"): AgentChatResponse {
  const fenced = rawContent.match(/```json\s*([\s\S]*?)\s*```/i);
  const bare = fenced ? null : rawContent.match(/\{[\s\S]*\}/);
  const jsonContent = fenced?.[1] ?? bare?.[0];
  let text = jsonContent ? rawContent.replace(fenced?.[0] ?? bare?.[0] ?? "", "").trim() : rawContent.trim();

  if (jsonContent) {
    try {
      const parsed = JSON.parse(jsonContent) as {
        action?: unknown;
        title?: unknown;
        course?: unknown;
        due?: unknown;
        hours?: unknown;
        cat?: unknown;
        microSteps?: unknown;
        vector?: unknown;
        val?: unknown;
      };
      const actionName = parsed.action;
      if (agent === "task" && (actionName === "PROPOSE_TASK" || actionName === "ADD_TASK")) {
        const rawSteps = Array.isArray(parsed.microSteps) ? parsed.microSteps : [];
        const microSteps: MicroStep[] = rawSteps.slice(0, 10).map((step, index) => {
          const item = step as { title?: unknown; minutes?: unknown };
          return {
            id: `draft-step-${index + 1}`,
            title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : `Micro-step ${index + 1}`,
            minutes: Math.max(5, Math.min(30, Number(item.minutes) || 15)),
          };
        });
        return {
          agent,
          text: text || "I drafted a task breakdown for you. Tell me what you want changed.",
          action: {
            type: "PROPOSE_TASK",
            payload: {
              title: typeof parsed.title === "string" ? parsed.title : "New Task",
              course: typeof parsed.course === "string" ? parsed.course : "ACADEMIC",
              due: typeof parsed.due === "string" ? parsed.due : "Soon",
              hours: typeof parsed.hours === "number" ? parsed.hours : 4,
              cat: parsed.cat === "physical" || parsed.cat === "social" || parsed.cat === "errands" ? parsed.cat : "mental",
              microSteps: microSteps.length > 0 ? microSteps : fallbackSteps(typeof parsed.title === "string" ? parsed.title : "this task"),
            },
          },
        };
      }
      if (agent === "wellbeing" && actionName === "UPDATE_GAUGE") {
        const vector = parsed.vector;
        const validVector = vector === "mental" || vector === "time" || vector === "physical" || vector === "social" || vector === "errands" ? vector : "mental";
        const value = typeof parsed.val === "number" ? Math.max(0, Math.min(100, parsed.val)) : 85;
        return { agent, text, action: { type: "UPDATE_GAUGE", payload: { vector: validVector, val: value } } };
      }
      if (agent === "wellbeing" && actionName === "TRIGGER_RECOVERY") {
        return { agent, text, action: { type: "TRIGGER_RECOVERY" } };
      }
    } catch {
      // Treat an invalid structured response as ordinary text.
    }
  }

  if (agent === "wellbeing") {
    const containsAssignmentGeneration =
      /##\s*Assignment|###\s*\*?Objective\*?|predicts? house sale prices|^\s*-\s*\[\s*\]|^\s*\d+\.\s*(Step|Phase|Task)/im.test(text);
    const failedToRedirect = isTaskCreationIntent(userMessage) && !/task agent/i.test(text);
    if (containsAssignmentGeneration || failedToRedirect) {
      if (mode === "both") {
        text = "Taking on new assignments can be demanding on your energy. The Task Agent is handling the plan and breakdown for you—remember to pace yourself, stay hydrated, and take breaks between focus blocks!";
      } else {
        text = "Task creation and assignment planning are handled exclusively by the Task Agent. Please switch to the Task Agent (or Both Agents) tab above to generate and break down this task! I'm here to support your wellbeing and stress levels—how are you feeling about taking on this workload?";
      }
    }
  }

  return { agent, text: text || "I’m here with you. Tell me a little more about what’s going on." };
}

async function requestAgentResponse(
  agent: AgentId,
  message: string,
  history: ChatMessage[],
  taskDraft?: Extract<AiAction, { type: "PROPOSE_TASK" }>["payload"] | undefined,
  mode: ChatMode = "both",
): Promise<AgentChatResponse> {
  const { config } = await import("dotenv");
  config();
  const apiKey = process.env["GROQ_API_KEY"] ?? process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    return agent === "task" ? taskFallback(message, taskDraft) : wellbeingFallback(message, mode);
  }

  const model = process.env["GROQ_MODEL"] ?? process.env["OPENAI_MODEL"] ?? "openai/gpt-oss-120b";
  const baseUrl = (process.env["GROQ_BASE_URL"] ?? process.env["OPENAI_BASE_URL"] ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
  const taskInstructions = "You are the BalanceAI Task Agent. Own assignments, task planning, and micro-step breakdowns. Never provide wellbeing actions. Do not create tasks immediately. For task requests, respond briefly and append JSON with action PROPOSE_TASK, task fields, and 2-10 microSteps. If more than 10 are requested, ask which assignment sections need extra detail. If a task draft is provided, revise it only when the user's message is feedback about that task; for emotional or unrelated messages, acknowledge that the draft remains available and return no action.";
  const wellbeingInstructions = "You are the BalanceAI Wellbeing Agent. Your SOLE role is user wellbeing, emotional support, stress management, 5-vector capacity check-ins, and burnout recovery. STRICT BOUNDARY: You MUST NEVER create tasks, plan assignments, generate homework/syllabi, produce to-do lists, or outline study steps. Task creation and assignment breakdowns are handled EXCLUSIVELY by the Task Agent. If the user asks you to create, plan, or break down a task or assignment: in Wellbeing mode, politely refuse and instruct them to switch to the Task Agent or Both Agents tab, then offer emotional/wellbeing support for their workload; in Both Agents mode, let the Task Agent output the plan and only provide a brief check-in on pacing and capacity. Respond empathetically without diagnosing or pretending to be a therapist. You may append JSON UPDATE_GAUGE or TRIGGER_RECOVERY when clearly appropriate. For serious self-harm signals, provide supportive guidance to contact emergency or crisis help and do not claim to solve the crisis.";
  const draftContext = taskDraft ? `\nCurrent task draft: ${JSON.stringify(taskDraft)}` : "";
  const modeContext = agent === "wellbeing"
    ? (mode === "both"
        ? "\n[Current mode: Both Agents active. The Task Agent is handling task planning. Do NOT output any task plan or steps; provide only wellbeing/stress support.]"
        : "\n[Current mode: Dedicated Wellbeing Agent active. If the user asks to create or plan a task/assignment, do NOT create it. Politely direct them to the Task Agent tab and offer wellbeing support.]")
    : "";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: `${agent === "task" ? taskInstructions : wellbeingInstructions}${draftContext}${modeContext}` },
          ...history.slice(-8).map((item) => ({ role: item.role, content: item.content })),
          { role: "user", content: message },
        ],
      }),
    });
    if (!response.ok) throw new Error("Agent request failed");
    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = json.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Agent returned no content");
    return parseAgentJson(raw, agent, message, mode);
  } catch {
    return agent === "task" ? taskFallback(message, taskDraft) : wellbeingFallback(message, mode);
  }
}

export const askMultiAgentAI = createServerFn({ method: "POST" })
  .validator((input: {
    message: string;
    history?: ChatMessage[] | undefined;
    mode?: ChatMode | undefined;
    taskDraft?: Extract<AiAction, { type: "PROPOSE_TASK" }>["payload"] | undefined;
  }) => input)
  .handler(async ({ data }): Promise<MultiAgentChatResponse> => {
    const message = (data?.message ?? "").trim();
    if (!message) throw new Error("Please type or speak a message before sending it to BalanceAI.");
    const mode = data?.mode ?? "both";
    const agents: AgentId[] = mode === "both" ? ["task", "wellbeing"] : [mode];
    const responses = await Promise.all(
      agents.map((agent) => requestAgentResponse(agent, message, data?.history ?? [], agent === "task" ? data?.taskDraft : undefined, mode)),
    );
    return { responses };
  });
