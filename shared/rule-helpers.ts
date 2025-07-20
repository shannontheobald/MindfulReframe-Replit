/**
 * MINDFUL REFRAME - RULE HELPER FUNCTIONS
 * 
 * Utility functions to apply RULES consistently across the application
 */

import { RULES } from './rules';

// ===========================
// 🤖 AI USAGE HELPERS
// ===========================

/**
 * Check if an AI operation is allowed by the rules
 */
export function isAllowedAIUseCase(taskName: string): boolean {
  return RULES.AI.ALLOWED_OPERATIONS.includes(taskName);
}

/**
 * Get the assistant tone and persona for GPT system prompts
 */
export function getAssistantTonePrompt() {
  const persona = RULES.AI.PERSONA;
  const tone = RULES.AI.TONE;
  
  return `You are ${persona.name}, an AI assistant with ${persona.voice} qualities and ${persona.energy}. 
Your approach is to ${persona.approach}.

Use these tone guidelines:
- ${tone.preferred.join('\n- ')}

Never use these prohibited phrases:
- ${tone.prohibited_phrases.join('\n- ')}

Remember: Guide through questions, not directive advice. Be supportive, curious, and growth-oriented.`;
}

/**
 * Get max tokens for AI requests based on operation type
 */
export function getMaxTokensForOperation(operationType: string): number {
  const maxTokens = RULES.COST_CONTROLS.TOKEN_LIMITS.maxTokensPerRequest;
  
  // Different operations may have different token needs
  const operationLimits: Record<string, number> = {
    'detectCognitiveDistortions': maxTokens,
    'summarizeJournalEntries': Math.floor(maxTokens * 0.5), // Summaries need fewer tokens
    'guideReframingProcess': maxTokens,
    'generateVisualizationPrompts': Math.floor(maxTokens * 0.3)
  };
  
  return operationLimits[operationType] || maxTokens;
}

/**
 * Determine which AI model to use based on task complexity
 */
export function getModelForTask(taskName: string): string {
  const strategy = RULES.COST_CONTROLS.MODEL_STRATEGY;
  
  // Use fallback model for simple tasks
  const simpleTasks = ['summarizeJournalEntries', 'generateVisualizationPrompts'];
  
  if (simpleTasks.includes(taskName) && strategy.useGPT4OnlyWhenNecessary) {
    return strategy.fallbackModel;
  }
  
  return strategy.primaryModel;
}

// ===========================
// 🔐 SECURITY HELPERS
// ===========================

/**
 * Check if input contains crisis indicators
 */
export function isCrisisText(input: string): boolean {
  if (!RULES.AI.CRISIS_DETECTION.enabled) return false;
  
  const triggers = RULES.AI.CRISIS_DETECTION.triggerPhrases;
  const lowercaseInput = input.toLowerCase();
  
  return triggers.some(phrase => lowercaseInput.includes(phrase));
}

/**
 * Check for prompt injection attempts
 */
export function shouldBlockPromptInjection(input: string): boolean {
  if (!RULES.AI.SECURITY.blockJailbreakAttempts) return false;
  
  const jailbreakPhrases = RULES.AI.SECURITY.jailbreakPhrases;
  const lowercaseInput = input.toLowerCase();
  
  return jailbreakPhrases.some(phrase => lowercaseInput.includes(phrase));
}

/**
 * Sanitize user input before sending to AI
 */
export function sanitizeUserInput(input: string): string {
  if (!RULES.AI.SECURITY.sanitizeBeforeAI) return input;
  
  // Remove potential HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Limit length
  const maxLength = RULES.SECURITY.INPUT_VALIDATION.maxJournalEntryLength;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
}

/**
 * Get crisis response message
 */
export function getCrisisResponse() {
  return RULES.AI.CRISIS_DETECTION.responseTemplate;
}

// ===========================
// 🚦 RATE LIMITING HELPERS
// ===========================

/**
 * Check if user has reached their daily token limit
 */
export function hasReachedDailyTokenLimit(userTokensUsedToday: number): boolean {
  const dailyLimit = RULES.COST_CONTROLS.TOKEN_LIMITS.dailyTokenCapPerUser;
  return userTokensUsedToday >= dailyLimit;
}

/**
 * Check if user is approaching token limit (warning threshold)
 */
export function isApproachingTokenLimit(userTokensUsedToday: number): boolean {
  const dailyLimit = RULES.COST_CONTROLS.TOKEN_LIMITS.dailyTokenCapPerUser;
  const warningThreshold = RULES.COST_CONTROLS.TOKEN_LIMITS.warningThresholdPercentage / 100;
  
  return userTokensUsedToday >= (dailyLimit * warningThreshold);
}

/**
 * Get rate limit for specific operation
 */
export function getRateLimit(operation: string): number | null {
  const limits = RULES.RATE_LIMITS.USER_LIMITS as Record<string, number>;
  return limits[operation] || null;
}

// ===========================
// 📈 SESSION MANAGEMENT HELPERS
// ===========================

/**
 * Check if user has reached session storage limit
 */
export function hasReachedSessionLimit(userSessionCount: number): boolean {
  const maxSessions = RULES.STORAGE.SESSION_MANAGEMENT.maxSavedSessionsPerUser;
  return userSessionCount >= maxSessions;
}

/**
 * Check if session export is allowed before deletion
 */
export function canExportSessionsBeforeDeletion() {
  return RULES.STORAGE.SESSION_MANAGEMENT.allowSessionExportBeforeDeletion;
}

/**
 * Get session cap reached behavior
 */
export function getSessionCapBehavior() {
  return {
    promptUser: RULES.STORAGE.SESSION_MANAGEMENT.promptUserWhenCapReached,
    allowExport: RULES.STORAGE.SESSION_MANAGEMENT.allowSessionExportBeforeDeletion
  };
}

/**
 * Check if feature requires paid subscription
 */
export function requiresPaidSubscription(feature: string): boolean {
  const premiumFeatures = RULES.STORAGE.PREMIUM_FEATURES;
  
  const featureMap: Record<string, boolean> = {
    'visualization': premiumFeatures.visualizationGenerationRequiresPaid,
    'unlimitedStorage': premiumFeatures.unlimitedSessionStorageForPaid,
    'analytics': premiumFeatures.extendedAnalyticsForPaid
  };
  
  return featureMap[feature] || false;
}

// ===========================
// ✅ FEATURE FLAG HELPERS
// ===========================

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(featurePath: string): boolean {
  const keys = featurePath.split('.');
  let current: any = RULES.FEATURE_FLAGS;
  
  for (const key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }
  
  return current === true;
}

// ===========================
// 🔍 VALIDATION HELPERS
// ===========================

/**
 * Validate journal entry meets requirements
 */
export function validateJournalEntry(entry: string): { isValid: boolean; errors: string[] } {
  const validation = RULES.SECURITY.INPUT_VALIDATION;
  
  const errors: string[] = [];
  
  if (!entry || entry.trim().length === 0) {
    errors.push('Journal entry cannot be empty');
  }
  
  if (entry.length > validation.maxJournalEntryLength) {
    errors.push(`Journal entry cannot exceed ${validation.maxJournalEntryLength} characters`);
  }
  
  if (validation.blockHtmlTags && /<[^>]*>/g.test(entry)) {
    errors.push('HTML tags are not allowed in journal entries');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check authentication requirements
 */
export function requiresAuthentication(operation: string): boolean {
  const auth = RULES.SECURITY.AUTHENTICATION;
  
  const protectedOperations: Record<string, boolean> = {
    'journalAccess': auth.requireLoginForJournalAccess,
    'sessions': auth.requireLoginForSessions
  };
  
  return protectedOperations[operation] || false;
}

export default {
  isAllowedAIUseCase,
  getAssistantTonePrompt,
  getMaxTokensForOperation,
  getModelForTask,
  isCrisisText,
  shouldBlockPromptInjection,
  sanitizeUserInput,
  getCrisisResponse,
  hasReachedDailyTokenLimit,
  isApproachingTokenLimit,
  getRateLimit,
  hasReachedSessionLimit,
  canExportSessionsBeforeDeletion,
  getSessionCapBehavior,
  requiresPaidSubscription,
  isFeatureEnabled,
  validateJournalEntry,
  requiresAuthentication
};