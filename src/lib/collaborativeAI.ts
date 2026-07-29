/**
 * Collaborative AI Actions
 * Handles AI interactions that require multi-turn conversation
 */

import { SystemContext, AIMessage } from "@/types/ai";
import { callGeminiConversation, callGeminiJSON } from "./gemini";
import { z } from "zod";

/**
 * Clarify project - Collaborative conversation to understand project better
 */
export async function clarifyProject(
  conversationHistory: AIMessage[],
  systemContext: SystemContext
): Promise<string> {
  if (!systemContext.currentProject) {
    throw new Error("No project selected");
  }

  const project = systemContext.currentProject;
  const hasDescription = project.description && project.description.trim().length > 0;

  // If no history, generate initial AI question
  if (conversationHistory.length === 0) {
    const hasDescription = project.description && project.description.trim().length > 0;
    
    let initialPrompt = "";
    if (!hasDescription) {
      initialPrompt = `I want to clarify and understand this project better. The project is called "${project.name}" but it doesn't have a description yet.

Please ask me questions to understand:
1. What is the main goal or purpose of this project?
2. What problem does it solve?
3. Who is the target audience?
4. What are the key features or components?
5. What are the technical requirements or constraints?
6. What is the expected timeline or milestones?

Ask one or two questions at a time, and wait for my response before asking more. Be conversational and helpful.`;
    } else {
      initialPrompt = `I want to refine and expand the description for project "${project.name}".

Current description:
${project.description}

Please ask me clarifying questions to help improve and expand this description. Focus on:
- Missing details or ambiguities
- Technical requirements
- User needs or use cases
- Success criteria
- Potential challenges or risks

Ask one or two questions at a time, and wait for my response. Be conversational and helpful.`;
    }

    // Call Gemini to get initial question
    const response = await callGeminiConversation(
      [{ role: "user" as const, content: initialPrompt }],
      systemContext
    );
    return response;
  }

  // Continue conversation with existing history
  const response = await callGeminiConversation(
    conversationHistory.map(m => ({ role: m.role, content: m.content })),
    systemContext
  );

  return response;
}

/**
 * Synthesize project description from conversation
 */
export async function synthesizeProjectDescription(
  conversationHistory: AIMessage[],
  systemContext: SystemContext
): Promise<string> {
  if (!systemContext.currentProject) {
    throw new Error("No project selected");
  }

  const project = systemContext.currentProject;
  
  const synthesisPrompt = `Based on our conversation, create a comprehensive project description for "${project.name}".

The description should:
- Be clear and well-structured
- Include the project's purpose, goals, and key features
- Mention technical requirements and constraints if discussed
- Be written in markdown format
- Be professional but accessible

Return ONLY the project description text in markdown format. Do not include any explanations or meta-commentary.`;

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: synthesisPrompt }
  ];

  const description = await callGeminiConversation(messages, systemContext);
  return description.trim();
}

/**
 * Generate High-Level Design (HLD)
 */
export async function generateHLD(
  conversationHistory: AIMessage[],
  systemContext: SystemContext
): Promise<string> {
  if (!systemContext.currentProject) {
    throw new Error("No project selected");
  }

  const project = systemContext.currentProject;
  
  if (!project.description || project.description.trim().length === 0) {
    throw new Error("Project must have a description before generating HLD. Please clarify the project first.");
  }

  // If no history, generate initial AI question
  if (conversationHistory.length === 0) {
    const hldPrompt = `Based on the project "${project.name}" and its description, I want to create a High-Level Design (HLD) document.

Project Description:
${project.description}

Before creating the HLD, please ask me clarifying questions about:
- Architecture preferences (monolith, microservices, etc.)
- Technology choices
- Key components and modules
- Integration requirements
- Scalability needs
- Security considerations

Ask one or two questions at a time, and wait for my response. Be conversational and helpful.`;

    const response = await callGeminiConversation(
      [{ role: "user" as const, content: hldPrompt }],
      systemContext
    );
    return response;
  }

  // Continue conversation or generate final HLD
  const hldPrompt = `Based on our conversation, create the High-Level Design (HLD) document for "${project.name}".

The HLD should include:
1. **Architecture Overview** - High-level system architecture
2. **Components/Modules** - Major components and their responsibilities
3. **Data Flow** - How data moves through the system
4. **Technology Stack** - Recommended technologies and tools
5. **Integration Points** - External systems or APIs
6. **Scalability Considerations** - How the system can scale
7. **Security Considerations** - Key security aspects

Format the output as a well-structured markdown document. Be specific and technical, but keep it at a high level (not implementation details).

Return ONLY the HLD document in markdown format.`;

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: hldPrompt }
  ];

  const hld = await callGeminiConversation(messages, systemContext);
  return hld.trim();
}

/**
 * Generate Low-Level Design (LLD)
 */
export async function generateLLD(
  conversationHistory: AIMessage[],
  systemContext: SystemContext,
  hldDocument?: string
): Promise<string> {
  if (!systemContext.currentProject) {
    throw new Error("No project selected");
  }

  const project = systemContext.currentProject;
  
  // Check if HLD exists in documents
  const hldContent = hldDocument || 
    (systemContext.existingDocuments?.find(d => 
      d.title.toLowerCase().includes("hld") || 
      d.title.toLowerCase().includes("high-level design")
    )?.content);

  if (!hldContent) {
    throw new Error("High-Level Design (HLD) must exist before generating LLD. Please generate HLD first.");
  }

  // If no history, generate initial AI question
  if (conversationHistory.length === 0) {
    const lldPrompt = `Based on the High-Level Design below, I want to create a detailed Low-Level Design (LLD) document.

High-Level Design:
${hldContent}

Before creating the LLD, please ask me clarifying questions about:
- Implementation details and patterns
- Specific API designs
- Database schema requirements
- Algorithm choices
- Error handling strategies
- Performance optimization needs

Ask one or two questions at a time, and wait for my response. Be conversational and helpful.`;

    const response = await callGeminiConversation(
      [{ role: "user" as const, content: lldPrompt }],
      systemContext
    );
    return response;
  }

  // Continue conversation or generate final LLD
  const lldPrompt = `Based on our conversation, create the detailed Low-Level Design (LLD) document.

High-Level Design:
${hldContent}

The LLD should include:
1. **Detailed Component Design** - Internal structure of each component
2. **API Specifications** - Detailed API contracts, endpoints, request/response formats
3. **Database Schema** - Data models, relationships, indexes
4. **Algorithm Details** - Key algorithms and their implementations
5. **Class/Module Structure** - Detailed class diagrams or module structure
6. **Error Handling** - Error scenarios and handling strategies
7. **Performance Considerations** - Optimization strategies
8. **Testing Strategy** - Unit, integration, and system testing approach

Format the output as a well-structured markdown document. Be very specific and detailed - this should be detailed enough for developers to implement.

Return ONLY the LLD document in markdown format.`;

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: lldPrompt }
  ];

  const lld = await callGeminiConversation(messages, systemContext);
  return lld.trim();
}

/**
 * Brainstorm - General collaborative discussion
 */
export async function brainstorm(
  conversationHistory: AIMessage[],
  userMessage: string,
  systemContext: SystemContext
): Promise<string> {
  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage }
  ];

  const response = await callGeminiConversation(messages, systemContext);
  return response;
}

