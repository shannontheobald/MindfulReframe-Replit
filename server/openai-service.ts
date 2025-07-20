import OpenAI from "openai";
import { RULES } from "../shared/rules";
import { 
  isAllowedAIUseCase, 
  getAssistantTonePrompt, 
  getMaxTokensForOperation,
  getModelForTask,
  isCrisisText,
  shouldBlockPromptInjection,
  sanitizeUserInput,
  getCrisisResponse
} from "../shared/rule-helpers";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DetectedThought {
  thought: string;
  distortion: string;
  explanation: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ReframingChatResponse {
  message: string;
  isComplete: boolean;
  finalReframedThought?: string;
  nextSuggestion?: string;
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
  },
  userTokensUsedToday: number = 0
): Promise<JournalAnalysis> {
  // Check if operation is allowed by rules
  if (!isAllowedAIUseCase('detectCognitiveDistortions')) {
    throw new Error("Cognitive distortion detection is not currently allowed");
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
  const sanitizedEntry = sanitizeUserInput(journalEntry);
  
  // Check for crisis indicators
  if (isCrisisText(sanitizedEntry)) {
    return {
      summary: getCrisisResponse(),
      detectedThoughts: [{
        thought: "Crisis support needed",
        distortion: "Crisis Support",
        explanation: "Please reach out for professional support."
      }]
    };
  }

  // Check for prompt injection attempts
  if (shouldBlockPromptInjection(sanitizedEntry)) {
    throw new Error("Invalid input detected. Please rephrase your journal entry.");
  }

  const contextPrompt = userContext
    ? `
Context about the user from their intake:
- Personal concerns: ${userContext.question1}
- Work/responsibility challenges: ${userContext.question2}
- Ideal life vision: ${userContext.question3}
- Sources of joy: ${userContext.question4}
- Core values: ${userContext.question5}

`
    : "";

  // Get assistant tone and persona from rules
  const assistantTonePrompt = getAssistantTonePrompt();

  const prompt = `${contextPrompt}${assistantTonePrompt}

Analyze the following journal entry and identify negative thought patterns and cognitive distortions.

Journal Entry:
"${sanitizedEntry}"

Please respond with JSON in this exact format:
{
  "summary": "A supportive 1-2 sentence summary of the journal entry",
  "detectedThoughts": [
    {
      "thought": "The specific negative thought or belief",
      "distortion": "The cognitive distortion name",
      "explanation": "A gentle, supportive explanation of how this distortion works"
    }
  ]
}

Cognitive Distortions to identify:
- All-or-Nothing Thinking: Seeing things in extremes
- Overgeneralization: Making sweeping conclusions from one event
- Mental Filtering: Focusing only on negatives, ignoring positives
- Disqualifying the Positive: Rejecting compliments or successes
- Jumping to Conclusions: Mind reading or fortune telling
- Magnification/Minimization: Catastrophizing or downplaying
- Emotional Reasoning: "I feel it, therefore it's true"
- Should Statements: Harsh self-expectations
- Labeling: Defining yourself by mistakes
- Personalization: Taking blame for things outside your control

Guidelines:
- Identify 2-4 most significant negative thoughts
- Use supportive, non-judgmental language
- Focus on thoughts that could genuinely benefit from reframing
- If no clear distortions exist, identify subtler patterns of negative thinking`;

  try {
    // Get model and token limits from rules
    const model = getModelForTask('detectCognitiveDistortions');
    const maxTokens = getMaxTokensForOperation('detectCognitiveDistortions');

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are Reframe, a compassionate AI assistant. Respond only with valid JSON following the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const analysis: JournalAnalysis = JSON.parse(content);
    
    // Validate response structure
    if (!analysis.summary || !Array.isArray(analysis.detectedThoughts)) {
      throw new Error("Invalid response format from OpenAI");
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

    const systemPrompt = `${getAssistantTonePrompt()}

You are guiding a user through reframing this negative thought: "${selectedThought}"
This thought shows signs of: ${distortionType}

Current reframing method: ${methodInfo.name} - ${methodInfo.focus}
Method guidance: ${methodInfo.guidance}

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
- They're thinking more realistically about the situation
- They express less emotional intensity about the thought

Respond with JSON: { "message": "your response", "isComplete": false, "finalReframedThought": null, "nextSuggestion": "optional next step" }

If they seem ready to finish, set isComplete to true and include their reframed thought.`;

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