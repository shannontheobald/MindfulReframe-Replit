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

  // Extract rich, specific details from user's responses
  const extractPersonalDetails = (text: string) => {
    const details = {
      places: [] as string[],
      people: [] as string[],
      activities: [] as string[],
      emotions: [] as string[],
      careers: [] as string[],
      values: [] as string[]
    };
    
    // Look for specific places (cities, countries, locations)
    const placeMatches = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)?.filter(match => 
      ['New York', 'London', 'Paris', 'Tokyo', 'Berlin', 'Barcelona', 'Lisbon', 'Amsterdam', 'Rome', 'Prague'].some(city => match.includes(city)) ||
      match.toLowerCase().includes('city') || match.toLowerCase().includes('town')
    ) || [];
    details.places = Array.from(new Set(placeMatches));
    
    // Look for people's names (capitalized words that aren't common nouns)
    const peopleMatches = text.match(/\b[A-Z][a-z]{2,}\b/g)?.filter(match => 
      !['The', 'And', 'But', 'When', 'Where', 'What', 'Why', 'How', 'This', 'That'].includes(match)
    ) || [];
    details.people = Array.from(new Set(peopleMatches.slice(0, 3))); // Limit to 3 names
    
    // Extract activities and interests
    const activityWords = ['art', 'music', 'writing', 'painting', 'photography', 'hiking', 'travel', 'cooking', 'reading', 'dancing', 'theater', 'film', 'business', 'startup', 'climate', 'environment', 'teaching', 'speaking', 'presenting'];
    details.activities = activityWords.filter(activity => text.toLowerCase().includes(activity));
    
    return details;
  };
  
  const personalDetails = {
    ...extractPersonalDetails(intakeContext.goals),
    ...extractPersonalDetails(intakeContext.dreams),
    ...extractPersonalDetails(intakeContext.currentChallenges),
    ...extractPersonalDetails(intakeContext.selfCareActivities)
  };

  const systemPrompt = `${getAssistantTonePrompt()}

You are creating an immersive, deeply personalized visualization meditation that reads like guided poetry. This is not generic—it should feel like it was written specifically for this person using their own words, dreams, and passions.

USER'S PERSONAL CONTEXT:
- Original limiting belief: "${originalThought}"
- New empowering belief: "${reframedBelief}"
- Personal goals: "${intakeContext.goals}"
- Dreams & aspirations: "${intakeContext.dreams}"
- Current challenges: "${intakeContext.currentChallenges}"
- Support network: "${intakeContext.supportSources}"
- Self-care practices: "${intakeContext.selfCareActivities}"

DETECTED PERSONAL ELEMENTS TO WEAVE IN:
- Places mentioned: ${personalDetails.places.join(', ') || 'none detected'}
- Important people: ${personalDetails.people.join(', ') || 'none detected'}
- Passions/Activities: ${personalDetails.activities.join(', ') || 'none detected'}

CREATE A POETIC VISUALIZATION MEDITATION (800-1000 words) with this structure:

**I. GROUNDING OPENING** (2-3 lines)
Begin with sensory grounding that connects to their self-care practices.

**II. ACKNOWLEDGING THE JOURNEY** (3-4 lines)
Honor where they are now, using their own words about feeling stuck/challenged.

**III. THE TRANSFORMATION MOMENT** (4-5 lines)
A pivotal, metaphorical moment where they release the old belief. Use rich imagery from their interests.

**IV. EMBODYING THE NEW BELIEF** (Main section, 8-10 lines)
Show them living their new belief through specific scenarios from their goals/dreams. Include:
- Their specific passions (art, climate, business, etc.)
- Places they've mentioned or dream of
- People in their support network
- Career scenarios they desire

**V. INTEGRATION & AFFIRMATION** (3-4 lines)
Close with first-person affirmations that mirror their reframed belief.

WRITING STYLE REQUIREMENTS:
- Use "you" throughout, present tense
- Rich sensory details (what you see, hear, feel, smell)
- Include specific names, places, and activities from their responses
- Poetic language with natural line breaks for meditative pacing
- Personal metaphors drawn from their interests (not generic nature imagery)
- First-person affirmations in the closing ("I am..." statements)
- Make it feel like a guided meditation they could actually experience

PERSONALIZATION MANDATES:
- If they mention specific people, include them warmly
- If they mention places, set scenes there
- If they mention career dreams, show them achieving those
- If they mention creative pursuits, weave those into metaphors
- Use their exact phrasing where possible, not paraphrases

The goal is a meditation so personal it could only be written for them, not a generic template.`;

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