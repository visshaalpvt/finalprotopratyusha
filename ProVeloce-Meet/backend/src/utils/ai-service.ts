/**
 * Ollama AI Service
 * Self-hosted LLM integration for ProVeloce Meet
 * 
 * Supports: Llama 3, Mistral, Qwen, DeepSeek, etc.
 * Endpoint: http://localhost:11434/api/generate
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3';
const TIMEOUT_MS = 120000; // 2 minutes for long generations

interface OllamaResponse {
    model: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}

interface GenerateOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

/**
 * Check if Ollama is running
 */
export async function isOllamaAvailable(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${OLLAMA_URL}/api/tags`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Get available models from Ollama
 */
export async function getAvailableModels(): Promise<string[]> {
    try {
        const response = await fetch(`${OLLAMA_URL}/api/tags`);
        if (!response.ok) return [];

        const data = await response.json() as { models?: { name: string }[] };
        return data.models?.map((m) => m.name) || [];
    } catch {
        return [];
    }
}

/**
 * Generate text using Ollama
 */
export async function generate(
    prompt: string,
    options: GenerateOptions = {}
): Promise<string> {
    const {
        model = DEFAULT_MODEL,
        temperature = 0.7,
        maxTokens = 2048,
        systemPrompt,
    } = options;

    const messages = [];
    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                messages,
                stream: false,
                options: {
                    temperature,
                    num_predict: maxTokens,
                },
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { message?: { content: string } };
        return data.message?.content || '';
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error('[AI] Generation error:', error.message);
        throw error;
    }
}

/**
 * Generate meeting summary from transcript
 */
export async function summarizeMeeting(
    transcript: string,
    options: GenerateOptions = {}
): Promise<{
    summary: string[];
    decisions: string[];
    actions: string[];
    risks: string[];
}> {
    const systemPrompt = `You are ProVeloce Meet's AI collaborator. You analyze meeting transcripts and provide structured insights.
Only discuss content from the provided transcript. Be concise and actionable.`;

    const prompt = `Analyze this meeting transcript and generate:
1. Summary (3-6 bullet points)
2. Key decisions made
3. Action items (with assignees if mentioned)
4. Risks or open questions

TRANSCRIPT:
${transcript}

Respond in JSON format:
{
  "summary": ["bullet 1", "bullet 2", ...],
  "decisions": ["decision 1", ...],
  "actions": ["action 1", ...],
  "risks": ["risk 1", ...]
}`;

    const response = await generate(prompt, {
        ...options,
        systemPrompt,
        temperature: 0.3, // Lower for more consistent output
    });

    try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch {
        console.warn('[AI] Failed to parse summary JSON, returning raw');
    }

    return {
        summary: [response],
        decisions: [],
        actions: [],
        risks: [],
    };
}

/**
 * Answer a question about a meeting using context chunks
 */
export async function askMeeting(
    question: string,
    contextChunks: string[],
    options: GenerateOptions = {}
): Promise<string> {
    const systemPrompt = `You are ProVeloce Meet's AI that answers questions ONLY based on the provided meeting transcript excerpts.
If the answer is not clearly found in the context, say you are not sure and suggest checking the full notes.
Reference who said what and when if relevant.`;

    const context = contextChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join('\n\n');

    const prompt = `MEETING CONTEXT:
${context}

QUESTION: ${question}

Answer concisely based only on the context above:`;

    return generate(prompt, {
        ...options,
        systemPrompt,
        temperature: 0.3,
    });
}

/**
 * Detect action items and decisions in real-time (lightweight)
 */
export async function detectActionItems(
    text: string
): Promise<{ type: 'action' | 'decision'; text: string }[]> {
    // Simple pattern matching for real-time detection (no LLM needed)
    const patterns = [
        // Action patterns
        { regex: /(?:I will|I'll|we will|we'll|need to|should|must|have to|going to)\s+(.+?)(?:\.|$)/gi, type: 'action' as const },
        { regex: /(?:action item|todo|task|follow up|follow-up):\s*(.+?)(?:\.|$)/gi, type: 'action' as const },
        { regex: /(?:assigned to|@\w+)\s+(.+?)(?:\.|$)/gi, type: 'action' as const },
        // Decision patterns
        { regex: /(?:we decided|decision|agreed|we'll go with|let's do)\s+(.+?)(?:\.|$)/gi, type: 'decision' as const },
    ];

    const items: { type: 'action' | 'decision'; text: string }[] = [];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.regex.exec(text)) !== null) {
            items.push({
                type: pattern.type,
                text: match[0].trim(),
            });
        }
    }

    return items;
}

export default {
    isOllamaAvailable,
    getAvailableModels,
    generate,
    summarizeMeeting,
    askMeeting,
    detectActionItems,
};
