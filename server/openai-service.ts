import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface DetectedThought {
  thought: string;
  distortion: string;
  explanation: string;
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

  const prompt = `${contextPrompt}You are a compassionate AI therapist specializing in Cognitive Behavioral Therapy. Analyze the following journal entry and identify negative thought patterns and cognitive distortions.

Journal Entry:
"${journalEntry}"

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
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a compassionate CBT therapist. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
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