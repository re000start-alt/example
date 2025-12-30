import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, availableProjects } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const projectsList = availableProjects?.length > 0 
      ? availableProjects.map((p: { id: string; name: string }) => `- ${p.name} (id: ${p.id})`).join('\n')
      : 'No projects available';

    const systemPrompt = `You are Jan, a friendly and helpful AI assistant for a task management dashboard. You help users manage their tasks, projects, reminders, and more through natural conversation.

AVAILABLE PROJECTS:
${projectsList}

CAPABILITIES:
1. Create tasks with title, description, priority (low/medium/high), status (todo/inprogress/completed/cancelled), due date, reminder, and project
2. Create new projects with name and color
3. Generate task titles and descriptions based on user requests
4. Change tone of text (formal, informal, friendly, professional, serious)
5. Improve, shorten, or lengthen text
6. Answer questions about how to use the dashboard
7. Provide productivity tips and suggestions

RESPONSE FORMAT:
When the user wants to perform an action, respond with JSON in this exact format:
{
  "action": "create_task" | "create_project" | "generate_content" | "change_tone" | "improve" | "shorten" | "lengthen" | "chat" | "ask_project",
  "data": {
    // For create_task:
    "title": "task title",
    "description": "task description",
    "priority": "low" | "medium" | "high",
    "status": "todo" | "inprogress" | "completed" | "cancelled",
    "dueDate": "YYYY-MM-DD" (optional),
    "reminder": "HH:MM" (optional, 24hr format),
    "projectId": "project uuid" (optional, null for Personal/no project)
    
    // For create_project:
    "name": "project name",
    "color": "#hex color"
    
    // For ask_project (asking user about project preference):
    "message": "your question about project",
    "pendingTask": { title, description, priority, status, dueDate, reminder }
    
    // For generate_content:
    "title": "generated title",
    "description": "generated description"
    
    // For change_tone/improve/shorten/lengthen:
    "text": "the modified text"
    
    // For chat (general conversation):
    "message": "your response message"
  },
  "confirmationNeeded": true | false,
  "confirmationMessage": "message asking user to confirm" (if confirmationNeeded is true)
}

PROJECT WORKFLOW:
- When creating a task, ALWAYS ask the user about project assignment first using "ask_project" action
- Say something like: "I'll create this task for you! Would you like to add it to 'Personal' (no project) or assign it to an existing project? You can also create a new project if you'd like."
- List available projects if any exist
- If user says "personal" or "no project", set projectId to null
- If user wants a new project, use "create_project" action first, then create the task
- If user specifies an existing project, use that project's id

GUIDELINES:
- Be conversational and friendly
- When creating tasks, first ask about project preference, then confirm the full task
- If the user's request is unclear, ask clarifying questions
- For task creation, always try to extract: title, description, priority, status, due date, reminder
- If information is missing, use sensible defaults or ask the user
- Default priority is "medium", default status is "todo"
- When user says "create a task about X", generate a good title and description
- Support both voice commands and text chat naturally
- Keep responses concise but helpful`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Try to parse as JSON, if it fails return as chat message
    try {
      // Remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith("```json")) {
        cleanResponse = cleanResponse.slice(7);
      }
      if (cleanResponse.startsWith("```")) {
        cleanResponse = cleanResponse.slice(3);
      }
      if (cleanResponse.endsWith("```")) {
        cleanResponse = cleanResponse.slice(0, -3);
      }
      cleanResponse = cleanResponse.trim();
      
      const parsed = JSON.parse(cleanResponse);
      return new Response(
        JSON.stringify(parsed),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch {
      // If not valid JSON, return as chat message
      return new Response(
        JSON.stringify({
          action: "chat",
          data: { message: aiResponse.replace(/[\*★]/g, '') }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("AI assistant error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
