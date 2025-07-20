/**
 * MINDFUL REFRAME - CORE RULES & BEHAVIOR CONFIGURATION
 * 
 * This file defines the complete behavioral framework for the Mindful Reframe app,
 * covering security, AI usage, cost controls, rate limiting, and user experience.
 * 
 * Export: ES module compatible with Replit environment
 * Usage: import { RULES } from '../shared/rules.js'
 */

export const RULES = {
  
  // ===========================
  // 🔐 SECURITY CONFIGURATION
  // ===========================
  SECURITY: {
    // Prevent sensitive data exposure
    LOGGING: {
      blockJournalEntryLogging: true,
      blockUserPersonalDataLogging: true,
      allowSystemMetricsLogging: true,
      auditLogRetentionDays: 30
    },

    // Authentication requirements
    AUTHENTICATION: {
      requireLoginForSessions: true,
      requireLoginForJournalAccess: true,
      tokenExpirationHours: 24,
      enableSessionIsolation: true, // Users can only access their own sessions
      enableSupabaseRLS: true // Row-Level Security
    },

    // Input sanitization and validation
    INPUT_VALIDATION: {
      maxJournalEntryLength: 5000,
      sanitizeUserInputs: true,
      blockHtmlTags: true,
      preventXSSAttacks: true
    }
  },

  // ===========================
  // 🤖 AI USAGE & TONE GUIDELINES
  // ===========================
  AI: {
    // Allowed AI use cases
    ALLOWED_OPERATIONS: [
      'detectCognitiveDistortions',
      'summarizeJournalEntries', 
      'guideReframingProcess',
      'generateVisualizationPrompts',
      'provideSupportiveReflection'
    ],

    // Prohibited AI operations
    PROHIBITED_OPERATIONS: [
      'provideClinicalAdvice',
      'makeMedicalDiagnosis',
      'openEndedChatNotRelatedToJournaling',
      'rolePlayAsTherapist',
      'giveDirectiveAdvice'
    ],

    // AI Assistant Persona
    PERSONA: {
      name: 'Reframe',
      voice: 'compassionate, curious, growth-oriented',
      energy: 'supportive big sister energy',
      approach: 'guide through questions, not directive advice'
    },

    // Tone guidelines
    TONE: {
      preferred: [
        'supportive and warm',
        'curious and exploratory', 
        'uses metaphors and affirming questions',
        'growth-oriented language',
        'validates feelings while exploring patterns'
      ],
      
      prohibited_phrases: [
        'Just get over it',
        'You\'re being irrational',
        'You should just...',
        'That\'s not logical',
        'Stop thinking that way',
        'You\'re overreacting'
      ]
    },

    // Crisis detection and response
    CRISIS_DETECTION: {
      enabled: true,
      triggerPhrases: [
        'want to die',
        'kill myself', 
        'end my life',
        'not worth living',
        'suicide',
        'hurt myself'
      ],
      responseTemplate: "I'm really sorry you're feeling this way. You are not alone. Please reach out to a professional or visit https://findahelpline.com to find a support service in your region.",
      escalateToHuman: true
    },

    // Prompt injection and jailbreak protection
    SECURITY: {
      blockJailbreakAttempts: true,
      jailbreakPhrases: [
        'ignore previous instructions',
        'pretend to be a therapist',
        'act as a doctor',
        'forget your guidelines',
        'you are now a',
        'system prompt:'
      ],
      sanitizeBeforeAI: true,
      validateResponseSafety: true
    }
  },

  // ===========================
  // 💸 AI COST CONTROLS
  // ===========================
  COST_CONTROLS: {
    // Model selection strategy
    MODEL_STRATEGY: {
      primaryModel: 'gpt-4o', // For complex distortion detection
      fallbackModel: 'gpt-3.5-turbo', // For lightweight summarization
      useGPT4OnlyWhenNecessary: true
    },

    // Token limits
    TOKEN_LIMITS: {
      maxTokensPerRequest: 600,
      dailyTokenCapPerUser: 20000,
      warningThresholdPercentage: 80, // Warn at 80% of daily cap
      trackTokenUsagePerUser: true
    },

    // Request optimization
    OPTIMIZATION: {
      cacheCommonDistortionPatterns: true,
      reuseAnalysisForSimilarEntries: false, // Each entry is unique
      compressRequestPayloads: true
    }
  },

  // ===========================
  // 🚦 RATE LIMITS & ABUSE PREVENTION
  // ===========================
  RATE_LIMITS: {
    // Per-user limits
    USER_LIMITS: {
      gptCallsPerMinute: 5,
      journalEntriesPerHour: 3,
      reframeSessionsPerDay: 5,
      maxConcurrentSessions: 1
    },

    // IP-based throttling (backup protection)
    IP_THROTTLING: {
      enabled: true,
      requestsPerMinute: 20,
      requestsPerHour: 100,
      blockSuspiciousIPs: true
    },

    // Abuse detection
    ABUSE_DETECTION: {
      detectSpamPatterns: true,
      detectBotBehavior: true,
      flagRepeatedIdenticalEntries: true,
      temporaryBanDurationMinutes: 60
    }
  },

  // ===========================
  // 📈 SCALING & SESSION STORAGE
  // ===========================
  STORAGE: {
    // Default storage strategy
    DEFAULT_STORAGE: {
      storeEssentialMetadataOnly: true,
      allowUserToFlagForFullStorage: true,
      metadataFields: [
        'beliefSummary',
        'distressScoreBefore',
        'distressScoreAfter', 
        'primaryDistortions',
        'sessionDate',
        'reframingSuccess'
      ]
    },

    // Session limits and cleanup
    SESSION_MANAGEMENT: {
      maxSavedSessionsPerUser: 20,
      autoDeleteUnflaggedSessionsDays: 30,
      promptUserWhenCapReached: true,
      allowSessionExportBeforeDeletion: true,
      enableLazyLoadingForPastSessions: true
    },

    // Premium features
    PREMIUM_FEATURES: {
      visualizationGenerationRequiresPaid: true,
      unlimitedSessionStorageForPaid: true,
      extendedAnalyticsForPaid: true
    }
  },

  // ===========================
  // 🧠 SESSION MEMORY & CROSS-SESSION LOGIC
  // ===========================
  MEMORY: {
    // Memory isolation
    ISOLATION: {
      isolateGPTMemoryBySession: true,
      allowCrossSessionReferences: false, // Unless user opts in
      requireOptInForPastReframes: true
    },

    // Context management
    CONTEXT: {
      sessionMemoryRetentionDays: 30,
      maxContextWindowTokens: 4000,
      prioritizeRecentSessions: true,
      includeUserIntakeInContext: true
    }
  },

  // ===========================
  // 📜 AUDIT TRAIL & MONITORING
  // ===========================
  AUDIT: {
    // What to log
    LOGGING: {
      enableGPTPromptResponseLogging: true,
      excludePIIFromLogs: true,
      logUserActions: true,
      logSystemPerformance: true,
      logSecurityEvents: true
    },

    // Retention and privacy
    RETENTION: {
      auditLogRetentionDays: 30,
      avoidFullJournalContentInAudit: true,
      anonymizeLogsAfterRetention: true
    }
  },

  // ===========================
  // ✅ FEATURE FLAGS
  // ===========================
  FEATURE_FLAGS: {
    // Development/experimental features
    EXPERIMENTAL: {
      enableNewReframeTool: false,
      betaVisualizationStyleV2: false,
      advancedDistortionCategories: false,
      groupSessionsFeature: false
    },

    // Performance optimizations
    PERFORMANCE: {
      useCachingOnDistortionDetection: true,
      enableRequestBatching: false,
      preloadCommonResponses: true
    },

    // Environment-specific overrides
    ENVIRONMENT_OVERRIDES: {
      allowOverrideInDev: true,
      allowOverrideInStaging: true,
      requireApprovalForProdOverrides: true
    }
  },

  // ===========================
  // 🌍 DATA COMPLIANCE & PRIVACY
  // ===========================
  COMPLIANCE: {
    // User data rights
    USER_RIGHTS: {
      allowDataExport: true,
      allowDataDeletion: true,
      provideDataPortability: true,
      enablePrivacyDashboard: true
    },

    // Data residency and retention
    DATA_MANAGEMENT: {
      dataStorageRegion: 'US',
      autoDeleteInactiveAccountsDays: 365,
      notifyBeforeAccountDeletion: true,
      gracePeriodDays: 30
    },

    // Legal compliance
    LEGAL: {
      enableGDPRCompliance: true,
      enableCCPACompliance: true,
      requireConsentForDataProcessing: true,
      provideClearPrivacyPolicy: true
    }
  },

  // ===========================
  // 🎯 OPERATIONAL SETTINGS
  // ===========================
  OPERATIONS: {
    // Health monitoring
    MONITORING: {
      enableHealthChecks: true,
      alertOnHighErrorRates: true,
      alertOnHighAICosts: true,
      monitorUserSatisfaction: true
    },

    // Performance targets
    PERFORMANCE_TARGETS: {
      aiResponseTimeMaxSeconds: 10,
      pageLoadTimeMaxSeconds: 3,
      systemUptimeTargetPercentage: 99.5
    },

    // Maintenance
    MAINTENANCE: {
      enableGracefulDegradation: true,
      provideFallbackResponses: true,
      scheduledMaintenanceWindowHours: [2, 4], // 2 AM - 4 AM UTC
      notifyUsersOfMaintenance: true
    }
  },

  // ===========================
  // 🛠️ DEVELOPMENT & CODE STABILITY
  // ===========================
  DEVELOPMENT: {
    // Code change restrictions
    CODE_STABILITY: {
      limitCodeChanges: true,
      allowChangesOnlyFor: [
        'addingNewFunctionality',
        'debuggingCriticalIssues',
        'securityVulnerabilityFixes',
        'performanceOptimizations',
        'userRequestedFeatures'
      ],
      
      prohibitChangesFor: [
        'stylingTweaks',
        'minorRefactoring',
        'unnecessaryOptimizations',
        'cosmetic improvements',
        'speculative enhancements'
      ],

      requireJustificationFor: [
        'architecturalChanges',
        'dependencyUpdates', 
        'apiModifications',
        'databaseSchemaChanges'
      ],

      preserveWorkingCode: true,
      avoidBreakingChanges: true,
      testBeforeDeploying: true
    },

    // Change management
    CHANGE_MANAGEMENT: {
      documentAllChanges: true,
      trackChangeReasons: true,
      requireApprovalForMajorChanges: true,
      maintainChangeLog: true,
      enableRollbackCapability: true
    }
  }
};

// ===========================
// 🔧 UTILITY FUNCTIONS
// ===========================

/**
 * Check if a feature flag is enabled for the current environment
 */
export function isFeatureEnabled(featurePath, environment = 'production') {
  const keys = featurePath.split('.');
  let current = RULES.FEATURE_FLAGS;
  
  for (const key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }
  
  return current === true;
}

/**
 * Get rate limit for a specific operation
 */
export function getRateLimit(operation) {
  const limits = RULES.RATE_LIMITS.USER_LIMITS;
  return limits[operation] || null;
}

/**
 * Check if input contains crisis indicators
 */
export function detectCrisisIndicators(input) {
  const triggers = RULES.AI.CRISIS_DETECTION.triggerPhrases;
  const lowercaseInput = input.toLowerCase();
  
  return triggers.some(phrase => lowercaseInput.includes(phrase));
}

/**
 * Check if input contains jailbreak attempts
 */
export function detectJailbreakAttempt(input) {
  const jailbreakPhrases = RULES.AI.SECURITY.jailbreakPhrases;
  const lowercaseInput = input.toLowerCase();
  
  return jailbreakPhrases.some(phrase => lowercaseInput.includes(phrase));
}

/**
 * Get crisis response template
 */
export function getCrisisResponse() {
  return RULES.AI.CRISIS_DETECTION.responseTemplate;
}

// Export individual rule sections for convenient access
export const SECURITY_RULES = RULES.SECURITY;
export const AI_RULES = RULES.AI;
export const COST_RULES = RULES.COST_CONTROLS;
export const RATE_LIMIT_RULES = RULES.RATE_LIMITS;
export const STORAGE_RULES = RULES.STORAGE;
export const COMPLIANCE_RULES = RULES.COMPLIANCE;

export default RULES;