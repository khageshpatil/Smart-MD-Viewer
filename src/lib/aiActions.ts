/**
 * AI Action Execution
 * Handles execution of AI-generated actions with validation
 */

import { AIAction, SystemContext } from "@/types/ai";
import { callGeminiJSON } from "./gemini";
import { Task, TaskType } from "./indexedDB";
import { z } from "zod";

/**
 * Schema for GENERATE_PROJECT_PLAN response
 */
const ProjectPlanSchema = z.object({
  phases: z.array(
    z.object({
      name: z.string(),
      tasks: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          type: z.enum(["build", "think", "write", "explore", "fix"]),
          estimatedPhase: z.number().optional(),
        })
      ),
    })
  ),
  summary: z.string().optional(),
});

export type ProjectPlan = z.infer<typeof ProjectPlanSchema>;

export interface GeneratedTask {
  title: string;
  description: string;
  type: TaskType;
  phaseName?: string;
}

export interface GenerateProjectPlanResult {
  tasks: GeneratedTask[];
  phases: Array<{
    name: string;
    taskCount: number;
  }>;
  summary?: string;
}

/**
 * Generate project plan using Gemini
 */
export async function generateProjectPlan(
  systemContext: SystemContext
): Promise<GenerateProjectPlanResult> {
  if (!systemContext.currentProject) {
    throw new Error("No project selected");
  }

  const project = systemContext.currentProject;
  const existingTasks = systemContext.existingTasks || [];
  const existingDocuments = systemContext.existingDocuments || [];

  // Find HLD and LLD documents
  const hldDoc = existingDocuments.find(d => 
    d.title.toLowerCase().includes("hld") || 
    d.title.toLowerCase().includes("high-level design") ||
    d.title.toLowerCase().includes("architecture")
  );
  const lldDoc = existingDocuments.find(d => 
    d.title.toLowerCase().includes("lld") || 
    d.title.toLowerCase().includes("low-level design") ||
    d.title.toLowerCase().includes("detailed design")
  );

  // Build context from design documents
  let designContext = "";
  if (lldDoc) {
    designContext = `Low-Level Design:\n${lldDoc.content}\n\n`;
  } else if (hldDoc) {
    designContext = `High-Level Design:\n${hldDoc.content}\n\n`;
  }

  // Build prompt - planning engine, strict JSON-only
  const prompt = `Given a project description${hldDoc || lldDoc ? " and design documents" : ""}, generate a structured task breakdown.

Project: ${project.name}
Description: ${project.description || "No description provided"}

${designContext}${existingTasks.length > 0 ? `Existing Tasks:\n${existingTasks.map(t => `- ${t.title} (${t.status})`).join("\n")}\n\nGenerate NEW tasks that complement the existing ones.` : ""}

Return a JSON response with this exact schema:
{
  "phases": [
    {
      "name": "Phase name (e.g., 'Setup', 'Development', 'Testing')",
      "tasks": [
        {
          "title": "Task title (clear and actionable)",
          "description": "Task description (detailed, markdown supported)",
          "type": "build" | "think" | "write" | "explore" | "fix",
          "estimatedPhase": 1
        }
      ]
    }
  ],
  "summary": "Brief summary of the project plan"
}

Requirements:
- Generate 5-15 tasks total (distributed across phases)
- Each task should be specific and actionable
- Use appropriate task types (build for coding, think for planning, write for documentation, explore for research, fix for debugging)
- Phases should be logical and sequential
- Task descriptions should be detailed and helpful

CRITICAL: Return ONLY valid JSON. Do not include:
- Any explanations or prose text
- Questions or conversational text
- Markdown code blocks (triple backticks)
- Any text before or after the JSON object

The response must be parseable JSON only.`;

  try {
    const response = await callGeminiJSON<ProjectPlan>(prompt, systemContext);

    // Validate response
    const validated = ProjectPlanSchema.parse(response);

    // Enforce task count limit (max 20)
    const totalTasks = validated.phases.reduce(
      (sum, phase) => sum + phase.tasks.length,
      0
    );

    if (totalTasks > 20) {
      throw new Error(
        `Too many tasks generated (${totalTasks}). Maximum is 20.`
      );
    }

    if (totalTasks === 0) {
      throw new Error("No tasks generated");
    }

    // Transform to GeneratedTask format
    const tasks: GeneratedTask[] = [];
    const phases: Array<{ name: string; taskCount: number }> = [];

    for (const phase of validated.phases) {
      phases.push({
        name: phase.name,
        taskCount: phase.tasks.length,
      });

      for (const task of phase.tasks) {
        tasks.push({
          title: task.title,
          description: task.description,
          type: task.type,
          phaseName: phase.name,
        });
      }
    }

    return {
      tasks,
      phases,
      summary: validated.summary,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid response format: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}

/**
 * Convert generated tasks to Task objects for IndexedDB
 */
export function convertGeneratedTasksToTasks(
  generatedTasks: GeneratedTask[],
  projectId: string
): Omit<Task, "id" | "createdAt" | "updatedAt">[] {
  const now = Date.now();

  return generatedTasks.map((gt) => ({
    projectId,
    title: gt.title,
    description: gt.description,
    status: "todo" as const,
    type: gt.type,
    tags: gt.phaseName ? [gt.phaseName] : [],
    linkedDocumentIds: [],
    linkedPRs: [],
  }));
}





