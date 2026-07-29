/**
 * Gemini API Client
 * Handles communication with Google Gemini API
 */

import { SystemContext } from "@/types/ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
// Using gemini-1.5-flash-latest for faster responses, can be changed to gemini-1.5-pro-latest for better quality
const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface GeminiError {
  error: string;
  message: string;
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY && GEMINI_API_KEY.trim() !== "";
}

/**
 * Call Gemini API with a prompt
 */
export async function callGemini(
  prompt: string,
  systemContext?: SystemContext
): Promise<GeminiResponse> {
  if (!isGeminiConfigured()) {
    throw new Error(
      "Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment."
    );
  }

  // Build full prompt with context if provided
  let fullPrompt = prompt;
  if (systemContext) {
    const contextParts: string[] = [];
    
    if (systemContext.currentProject) {
      contextParts.push(`Current Project: ${systemContext.currentProject.name}`);
      if (systemContext.currentProject.description) {
        contextParts.push(`Description: ${systemContext.currentProject.description}`);
      }
    }
    
    if (systemContext.currentDocument) {
      contextParts.push(`Current Document: ${systemContext.currentDocument.title}`);
    }
    
    if (systemContext.existingTasks && systemContext.existingTasks.length > 0) {
      contextParts.push(
        `Existing Tasks:\n${systemContext.existingTasks
          .map((t) => `- ${t.title} (${t.status})`)
          .join("\n")}`
      );
    }

    if (contextParts.length > 0) {
      fullPrompt = `Context:\n${contextParts.join("\n\n")}\n\n${prompt}`;
    }
  }

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Provide helpful error messages for common issues
      if (response.status === 403) {
        const errorMessage = errorData.error?.message || "Forbidden";
        if (errorMessage.includes("API key") || errorMessage.includes("permission")) {
          throw new Error(
            `API Key Error (403): ${errorMessage}. ` +
            `Check: 1) API key is valid, 2) API key restrictions allow this domain, ` +
            `3) Generative Language API is enabled in Google Cloud Console. ` +
            `For production, set VITE_GEMINI_API_KEY in your hosting platform's environment variables.`
          );
        }
        throw new Error(
          `Access Denied (403): ${errorMessage}. ` +
          `Your API key may have domain restrictions. ` +
          `Go to Google Cloud Console > APIs & Services > Credentials > Your API Key > ` +
          `Application restrictions and allow your domain (e.g., *.netlify.app or your custom domain).`
        );
      }
      
      throw new Error(
        errorData.error?.message ||
          `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Extract text from response
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.text ||
      "";

    if (!text) {
      throw new Error("No text returned from Gemini API");
    }

    // Extract usage information if available
    const usage = data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount || 0,
          completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        }
      : undefined;

    return {
      text,
      usage,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to call Gemini API");
  }
}

/**
 * Call Gemini with JSON schema enforcement
 * Attempts to extract and parse JSON from the response
 */
export async function callGeminiJSON<T>(
  prompt: string,
  systemContext?: SystemContext
): Promise<T> {
  const response = await callGemini(prompt, systemContext);
  
  // Try to extract JSON from the response
  // Gemini might return JSON wrapped in markdown code blocks or plain text
  let jsonText = response.text.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  // Try to find JSON object/array in the text
  const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    jsonText = jsonObjectMatch[0];
  }

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    throw new Error(
      `Failed to parse JSON from Gemini response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Call Gemini for collaborative conversation
 * Returns natural language response (not JSON)
 */
export async function callGeminiConversation(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemContext?: SystemContext
): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error(
      "Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your environment."
    );
  }

  // Build conversation history
  const conversationHistory = messages.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }]
  }));

  // Build system context if provided
  let systemInstruction = "";
  if (systemContext) {
    const contextParts: string[] = [];
    
    if (systemContext.currentProject) {
      contextParts.push(`Current Project: ${systemContext.currentProject.name}`);
      if (systemContext.currentProject.description) {
        contextParts.push(`Project Description: ${systemContext.currentProject.description}`);
      }
    }
    
    if (systemContext.currentDocument) {
      contextParts.push(`Current Document: ${systemContext.currentDocument.title}`);
    }
    
    if (systemContext.existingTasks && systemContext.existingTasks.length > 0) {
      contextParts.push(`Existing Tasks: ${systemContext.existingTasks.map(t => t.title).join(", ")}`);
    }
    
    if (contextParts.length > 0) {
      systemInstruction = `Context:\n${contextParts.join("\n")}\n\n`;
    }
  }

  // Build the request payload
  const requestBody: any = {
    contents: conversationHistory,
  };

  // Add system instruction if we have context
  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      data.text ||
      "";

    if (!text) {
      throw new Error("No text returned from Gemini API");
    }

    return text;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to call Gemini API");
  }
}

