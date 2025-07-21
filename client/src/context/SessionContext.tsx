import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DetectedThought {
  thought: string;
  distortion: string;
  explanation: string;
}

interface AnalysisResult {
  sessionId: number;
  summary: string;
  detectedThoughts: DetectedThought[];
}

interface SessionLimitError {
  message: string;
  sessionCount: number;
  maxSessions: number;
  canExport: boolean;
}

interface SessionContextType {
  analysisResult: AnalysisResult | null;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  sessionLimitError: SessionLimitError | null;
  setSessionLimitError: (error: SessionLimitError | null) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider = ({ children }: SessionProviderProps) => {
  const [analysisResult, setAnalysisResultState] = useState<AnalysisResult | null>(null);
  const [sessionLimitError, setSessionLimitError] = useState<SessionLimitError | null>(null);

  // Load analysis result from localStorage on mount
  useEffect(() => {
    const savedAnalysis = localStorage.getItem('analysisResult');
    if (savedAnalysis) {
      try {
        const parsedAnalysis = JSON.parse(savedAnalysis);
        setAnalysisResultState(parsedAnalysis);
      } catch (error) {
        console.error('Failed to parse saved analysis result:', error);
        localStorage.removeItem('analysisResult');
      }
    }
  }, []);

  // Enhanced setAnalysisResult that also handles localStorage
  const setAnalysisResult = (result: AnalysisResult | null) => {
    setAnalysisResultState(result);
    if (result) {
      localStorage.setItem('analysisResult', JSON.stringify(result));
    } else {
      localStorage.removeItem('analysisResult');
    }
  };

  // Clear all session data
  const clearSession = () => {
    setAnalysisResultState(null);
    setSessionLimitError(null);
    localStorage.removeItem('analysisResult');
  };

  return (
    <SessionContext.Provider value={{
      analysisResult,
      setAnalysisResult,
      sessionLimitError,
      setSessionLimitError,
      clearSession
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};