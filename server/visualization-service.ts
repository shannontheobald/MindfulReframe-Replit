import OpenAI from 'openai';
import { getAssistantTonePrompt } from '../shared/rules';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface VisualizationRequest {
  originalThought: string;
  reframedBelief: string;
  distortion: string;
  intakeContext: {
    goals: string;
    dreams: string;
    currentChallenges: string;
    supportSources: string;
    selfCareActivities: string;
  };
}

export interface VisualizationResponse {
  visualization: string;
}

export async function generateVisualization(
  request: VisualizationRequest
): Promise<VisualizationResponse> {
  const { originalThought, reframedBelief, distortion, intakeContext } = request;

  const systemPrompt = `${getAssistantTonePrompt()}

You are creating a custom visualization meditation that helps the user embody their new empowering belief and connect it to their personal goals and dreams.

Context:
- Original limiting thought: "${originalThought}"
- Cognitive distortion pattern: ${distortion}
- New empowering belief: "${reframedBelief}"
- User's goals: "${intakeContext.goals}"
- User's dreams: "${intakeContext.dreams}"
- Current challenges: "${intakeContext.currentChallenges}"
- Support sources: "${intakeContext.supportSources}"
- Self-care activities: "${intakeContext.selfCareActivities}"

Create a guided visualization (750-1000 words) that:

1. **Opening Relaxation** (2-3 sentences): Begin with calming, grounding instructions
2. **Current State Acknowledgment** (1-2 sentences): Briefly acknowledge where they are now
3. **Transformation Bridge** (3-4 sentences): Guide them to release the old belief and embrace the new one
4. **Living the New Belief** (Main section - 6-8 sentences): Vividly describe them embodying their new empowering belief in daily life
5. **Achieving Goals & Dreams** (4-5 sentences): Show them living their goals and dreams with this new mindset
6. **Sensory Details** (Throughout): Include what they see, feel, hear, and experience
7. **Closing Integration** (2-3 sentences): Help them carry this feeling into their real life

Writing style:
- Use "you" throughout (second person)
- Present tense for the visualization scenes
- Warm, encouraging, and specific to their context
- Include concrete, relatable scenarios from their daily life
- Connect their new belief directly to achieving their stated goals
- Make it feel achievable and realistic, not fantasy-like

Focus on practical scenarios where their new empowering belief helps them navigate challenges, connect with others, pursue their goals, and feel more confident in their daily life.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please create a personalized visualization meditation for this transformation.`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const visualization = response.choices[0].message.content;
    
    if (!visualization) {
      throw new Error("Failed to generate visualization content");
    }

    return {
      visualization: visualization.trim()
    };

  } catch (error: any) {
    console.error("Error generating visualization:", error);
    
    if (error.code === 'rate_limit_exceeded') {
      throw new Error("AI service temporarily unavailable due to high demand. Please try again in a few moments.");
    }
    
    if (error.code === 'insufficient_quota') {
      throw new Error("AI service quota exceeded. Please contact support.");
    }
    
    throw new Error("Failed to generate visualization. Please try again.");
  }
}