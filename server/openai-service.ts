import OpenAI from 'openai';
import type { DetectedThought, ChatMessage, ReframingChatResponse, JournalAnalysis } from '../shared/schema';
import { getRules } from '../shared/rules';

const RULES = getRules();

export interface DetectedThought {
  thought: string;
  distortion: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ReframingChatResponse {
  message: string;
  isComplete: boolean;
  showPacingOptions?: {
    options: { key: string; label: string }[];
  };
}

export interface JournalAnalysis {
  summary: string;
  detectedThoughts: DetectedThought[];
}

export async function analyzeJournalEntry(
  journalEntry: string,
  userContext?: {
    question1?: string;
    question2?: string; 
    question3?: string;
    question4?: string;
    question5?: string;
  }
): Promise<JournalAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Basic input validation
  if (!journalEntry || journalEntry.trim().length === 0) {
    throw new Error("Journal entry cannot be empty");
  }

  const contextPrompt = userContext ? `
User background (use this to personalize your analysis):
- Values most: ${userContext.question1 || 'Unknown'}
- Biggest challenge: ${userContext.question2 || 'Unknown'}  
- Preferred support: ${userContext.question3 || 'Unknown'}
- Self-care methods: ${userContext.question4 || 'Unknown'}
- Growth areas: ${userContext.question5 || 'Unknown'}
` : '';

  const prompt = `You are a compassionate CBT assistant helping users identify negative thought patterns.

${contextPrompt}

Analyze this journal entry and identify 2-4 specific negative thoughts or beliefs that could benefit from CBT reframing. For each thought:

1. Extract the exact wording or close paraphrase
2. Identify the primary cognitive distortion
3. Provide a brief, compassionate explanation

Common cognitive distortions: All-or-Nothing Thinking, Overgeneralization, Mental Filter, Discounting Positives, Jumping to Conclusions, Magnification/Minimization, Emotional Reasoning, Should Statements, Labeling, Personalization

Provide your response in JSON format:
{
  "summary": "Brief empathetic summary (1-2 sentences)",
  "detectedThoughts": [
    {
      "thought": "exact negative thought",
      "distortion": "Cognitive Distortion Name", 
      "explanation": "gentle explanation of how this pattern might be affecting them"
    }
  ]
}

Journal entry: "${filteredEntry}"`;

  try {
    const model = getModelForTask('analyzeJournalEntry');
    const maxTokens = getMaxTokensForOperation('analyzeJournalEntry');

    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error("No response from AI service");
    }

    const analysis: JournalAnalysis = JSON.parse(result);

    // Validate the response structure
    if (!analysis.summary || !analysis.detectedThoughts || !Array.isArray(analysis.detectedThoughts)) {
      throw new Error("Invalid response format");
    }

    // Ensure we have at least one thought and no more than 4
    if (analysis.detectedThoughts.length === 0) {
      analysis.detectedThoughts = [{
        thought: "I'm struggling with this situation",
        distortion: "Emotional Reasoning",
        explanation: "Sometimes strong emotions can make situations feel more difficult than they are. Let's explore this together."
      }];
    } else if (analysis.detectedThoughts.length > 4) {
      analysis.detectedThoughts = analysis.detectedThoughts.slice(0, 4);
    }

    return analysis;
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze journal entry");
  }
}

/**
 * Chat-based reframing service for guiding users through CBT reframing
 */
export async function chatReframe(
  selectedThought: string,
  distortionType: string,
  reframingMethod: string,
  userMessage: string,
  chatHistory: ChatMessage[] = [],
  turnCount: number = 0,
  maxTurns: number = 12,
  userContext?: {
    question1?: string;
    question2?: string;
    question3?: string;
    question4?: string;
    question5?: string;
  },
  userTokensUsedToday: number = 0
): Promise<ReframingChatResponse> {
  // Check if operation is allowed by rules
  if (!isAllowedAIUseCase('guideReframingProcess')) {
    throw new Error("Reframing guidance is not currently allowed");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  // Check daily token limit
  const dailyLimit = RULES.COST_CONTROLS.TOKEN_LIMITS.dailyTokenCapPerUser;
  if (userTokensUsedToday >= dailyLimit) {
    throw new Error("Daily AI usage limit reached. Please try again tomorrow.");
  }

  // Sanitize and validate input
  const sanitizedMessage = sanitizeUserInput(userMessage);
  
  // Check for crisis indicators
  if (isCrisisText(sanitizedMessage)) {
    return {
      message: getCrisisResponse(),
      isComplete: false
    };
  }

  // Check for prompt injection attempts
  if (shouldBlockPromptInjection(sanitizedMessage)) {
    return {
      message: "I noticed something unusual in your message. Could you rephrase what you're thinking about this thought?",
      isComplete: false
    };
  }

  try {
    // Get user context for personalization
    const contextPrompt = userContext ? `
User background (use this to personalize your approach):
- Values most: ${userContext.question1 || 'Unknown'}
- Biggest challenge: ${userContext.question2 || 'Unknown'}
- Preferred support: ${userContext.question3 || 'Unknown'}
- Self-care methods: ${userContext.question4 || 'Unknown'}
- Growth areas: ${userContext.question5 || 'Unknown'}
` : '';

    const reframingMethods = {
      'evidenceCheck': {
        name: 'Evidence Examination',
        focus: 'Look for facts that support or contradict this thought',
        guidance: 'Guide them to examine concrete evidence, ask for specific examples, and help them distinguish between facts and interpretations.'
      },
      'alternativePerspectives': {
        name: 'Alternative Perspectives',
        focus: 'Consider other ways to view this situation', 
        guidance: 'Help them explore different viewpoints, consider how others might see it, and find multiple explanations for the same situation.'
      },
      'balancedThinking': {
        name: 'Balanced Thinking',
        focus: 'Find a more nuanced, realistic perspective',
        guidance: 'Guide them away from extremes toward middle ground, help them see both positives and negatives, and find realistic assessments.'
      },
      'compassionateSelf': {
        name: 'Self-Compassion',
        focus: 'How would you speak to a good friend in this situation?',
        guidance: 'Encourage self-kindness, help them treat themselves as they would a friend, and reduce harsh self-criticism.'
      },
      'actionOriented': {
        name: 'Action Focus', 
        focus: 'What can you actually control or influence here?',
        guidance: 'Focus on actionable steps, help distinguish between what they can and cannot control, and encourage problem-solving.'
      }
    };

    const methodInfo = reframingMethods[reframingMethod as keyof typeof reframingMethods] || reframingMethods.evidenceCheck;

    // Build conversation history for context
    const conversationContext = chatHistory.length > 0 
      ? `Previous conversation:\n${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n`
      : '';

    // Check if we need to show pacing options (after every 6 messages = 3 full exchanges)
    // The new turnCount will be +2 after this exchange, so check if it will reach a pacing checkpoint
    const nextTurnCount = turnCount + 2;  // +2 because we'll add user message + AI response
    const shouldShowPacingOptions = nextTurnCount >= 6 && (nextTurnCount % 6 === 0);
    const reachedTurnLimit = nextTurnCount >= maxTurns;
    
    console.log(`Pacing debug: currentTurn=${turnCount}, nextTurn=${nextTurnCount}, shouldShowPacing=${shouldShowPacingOptions}`);

    let systemPrompt = `${getAssistantTonePrompt()}

You are guiding a user through reframing this negative thought: "${selectedThought}"
This thought shows signs of: ${distortionType}

Current reframing method: ${methodInfo.name} - ${methodInfo.focus}
Method guidance: ${methodInfo.guidance}

Turn tracking: This is turn ${turnCount + 1} of maximum ${maxTurns} exchanges.

${contextPrompt}

${conversationContext}

Your role:
1. Ask thoughtful questions to help them examine this thought
2. Guide them to discover insights themselves (don't give direct answers)  
3. Use the specific reframing method focus
4. Keep responses short and conversational (2-3 sentences max)
5. When they've made good progress, suggest they write their reframed thought

Look for signs they're ready to complete:
- They've identified evidence against the thought
- They've found a more balanced perspective
- They're speaking more compassionately about themselves
- They've recognized the distortion pattern`;

    if (shouldShowPacingOptions || reachedTurnLimit) {
      systemPrompt += `

IMPORTANT: This user has been working for a while (${Math.floor(nextTurnCount/2)} exchanges). After your response, you MUST set "showPacingOptions" to true and provide these exact options:
- Keep Reframing: Continue working on this thought
- Try Different Thought: Go back to pick another thought to work on  
- Create Visualization: Generate a meditation based on their progress

${reachedTurnLimit ? 'They have reached the turn limit, so encourage them to use one of these options.' : ''}`;
    }

    systemPrompt += `

Respond in JSON format:
{
  "message": "your response to guide them",
  "isComplete": false,
  "showPacingOptions": ${shouldShowPacingOptions || reachedTurnLimit ? '{ "options": [{"key": "keep", "label": "Keep Reframing"}, {"key": "different", "label": "Try Different Thought"}, {"key": "visualize", "label": "Create Visualization"}] }' : 'null'}
}`;

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const model = getModelForTask('guideReframingProcess');
    const maxTokens = getMaxTokensForOperation('guideReframingProcess');

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: sanitizedMessage }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error("No response from AI service");
    }

    try {
      const parsedResponse: ReframingChatResponse = JSON.parse(result);
      
      // Validate the response structure
      if (!parsedResponse.message) {
        throw new Error("Invalid response format");
      }

      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("AI service returned an invalid response format");
    }
  } catch (error: any) {
    console.error("Reframing chat error:", error);
    
    // Provide fallback response
    return {
      message: "I'm having trouble right now. Let's take a step back - what first comes to mind when you think about this thought differently?",
      isComplete: false
    };
  }
}

class OpenAIService {
  private openai: OpenAI;
  
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Generate personalized visualization meditation
  async generateVisualization({
    userId,
    intakeResponses,
    reframedBelief,
    specificGoal
  }: {
    userId: number;
    intakeResponses: any;
    reframedBelief: string;
    specificGoal?: string | null;
  }) {
    const rules = getRules();
    
    // Check for crisis content
    if (rules.AI.CRISIS_DETECTION.enabled) {
      const hasCrisisContent = rules.AI.CRISIS_DETECTION.triggerPhrases.some(phrase =>
        reframedBelief.toLowerCase().includes(phrase.toLowerCase())
      );
      
      if (hasCrisisContent) {
        throw new Error(rules.AI.CRISIS_DETECTION.responseTemplate);
      }
    }

    // Build personalized context from intake responses
    const personalContext = `
User's Goals and Aspirations:
- ${intakeResponses.question2 || 'Not specified'}
- ${intakeResponses.question3 || 'Not specified'}

Personal Background:
- Current life situation: ${intakeResponses.question1 || 'Not specified'}
- Values and what matters most: ${intakeResponses.question4 || 'Not specified'}
- Self-care and growth focus: ${intakeResponses.question5 || 'Not specified'}

Their Reframed Belief: "${reframedBelief}"
${specificGoal ? `Specific Focus Area: ${specificGoal}` : ''}`;

    const systemPrompt = `You are creating a personalized visualization meditation that helps the user embody their new reframed belief in their ideal life.

${personalContext}

Create a detailed, immersive visualization that:
1. Takes them through a vivid scenario where they're living in alignment with their reframed belief
2. Shows them achieving or working toward the goals they mentioned in their intake
3. Includes specific sensory details (what they see, hear, feel)
4. Demonstrates how their new belief enables them to act with confidence, peace, or authenticity
5. Connects their transformed mindset to their actual dreams and aspirations
6. Is 4-6 minutes when read aloud (approximately 800-1200 words)

Make it personal to their specific life context. Use "you" throughout. Include realistic scenarios from their life where this belief would serve them.

Structure your response as JSON:
{
  "visualization": "The complete meditation script with paragraph breaks",
  "duration": "5-7 minutes",
  "keyThemes": ["confidence", "authenticity", "growth"] // 3-5 key themes
}`;

    const userPrompt = `Generate a personalized visualization meditation that helps me practice embodying this belief: "${reframedBelief}"

My context:
${personalContext}

Make it vivid, realistic, and directly connected to my goals and values.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        visualization: result.visualization || "Visualization could not be generated.",
        duration: result.duration || "5-6 minutes",
        keyThemes: result.keyThemes || ["mindfulness", "growth", "self-compassion"]
      };
      
    } catch (error) {
      console.error("OpenAI API error in visualization generation:", error);
      throw new Error("Failed to generate visualization");
    }
  }
}

export const openaiService = new OpenAIService();