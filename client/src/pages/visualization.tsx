import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface VisualizationData {
  id: number;
  visualization: string;
  intakeContext: {
    goals: string;
    dreams: string;
    currentChallenges: string;
    supportSources: string;
    selfCareActivities: string;
  };
  reframedBelief: string;
  originalThought: string;
  distortion: string;
  createdAt: string;
}

export default function VisualizationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('sessionId');
  const userId = searchParams.get('userId');
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(-1);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Generate visualization mutation
  const generateVisualizationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/visualization/generate`, {
        method: 'POST',
        body: JSON.stringify({
          reframingSessionId: parseInt(sessionId!),
          userId: parseInt(userId!)
        })
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['visualization', sessionId], data);
      toast({
        title: "Visualization Created",
        description: "Your personalized meditation visualization is ready!",
      });
    },
    onError: (error: any) => {
      console.error("Error generating visualization:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to create visualization. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Fetch existing visualization
  const { data: visualizationData, isLoading: isLoadingVisualization } = useQuery<VisualizationData>({
    queryKey: ['visualization', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/visualization/${sessionId}?userId=${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No visualization exists yet
        }
        throw new Error('Failed to fetch visualization');
      }
      return response.json();
    },
    enabled: !!sessionId && !!userId
  });

  // Auto-generate visualization if it doesn't exist
  useEffect(() => {
    if (!isLoadingVisualization && visualizationData === null && sessionId && userId && !generateVisualizationMutation.isPending) {
      generateVisualizationMutation.mutate();
    }
  }, [isLoadingVisualization, visualizationData, sessionId, userId]);

  const handleBack = () => {
    window.history.back();
  };

  const handleStartOver = () => {
    setLocation('/session');
  };

  // Split visualization text into paragraphs for audio playback
  const visualizationParagraphs = visualizationData?.visualization.split('\n\n').filter(p => p.trim()) || [];

  const startAudioPlayback = () => {
    if (!speechSynthesis || !visualizationData) return;
    
    // Stop any current speech
    speechSynthesis.cancel();
    
    const text = visualizationData.visualization;
    const newUtterance = new SpeechSynthesisUtterance(text);
    
    // Configure speech settings
    newUtterance.rate = 0.8; // Slower for meditation
    newUtterance.pitch = 1.0;
    newUtterance.volume = 0.9;
    
    // Try to use a calm, pleasant voice
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Karen') || 
      voice.name.includes('Samantha')
    );
    if (preferredVoice) {
      newUtterance.voice = preferredVoice;
    }

    newUtterance.onstart = () => {
      setIsPlaying(true);
      setCurrentParagraph(0);
    };

    newUtterance.onend = () => {
      setIsPlaying(false);
      setCurrentParagraph(-1);
    };

    newUtterance.onerror = () => {
      setIsPlaying(false);
      setCurrentParagraph(-1);
      toast({
        title: "Audio Error",
        description: "Unable to play audio. Please read the visualization text instead.",
        variant: "destructive"
      });
    };

    speechSynthesis.speak(newUtterance);
    setUtterance(newUtterance);
  };

  const pauseAudioPlayback = () => {
    if (speechSynthesis && isPlaying) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentParagraph(-1);
    }
  };

  const resetAudioPlayback = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentParagraph(-1);
    }
  };

  if (!sessionId || !userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle>Missing Information</CardTitle>
              <CardDescription>
                Unable to load visualization. Session ID or User ID is missing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setLocation('/session')}>
                Go to Session Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isGenerating = generateVisualizationMutation.isPending;
  const isLoading = isLoadingVisualization || isGenerating;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Personalized Visualization
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              A guided meditation to embody your new empowering belief
            </p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">
                  {isGenerating ? "Creating Your Visualization..." : "Loading..."}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isGenerating 
                    ? "This may take a moment as we craft something personal just for you."
                    : "Please wait while we load your visualization."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : visualizationData ? (
          <div className="space-y-6">
            {/* Transformation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Transformation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Original Thought:</h4>
                  <p className="text-gray-600 dark:text-gray-400 italic">"{visualizationData.originalThought}"</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Cognitive Pattern:</h4>
                  <p className="text-gray-600 dark:text-gray-400">{visualizationData.distortion}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">New Empowering Belief:</h4>
                  <p className="text-blue-700 dark:text-blue-300 font-medium">"{visualizationData.reframedBelief}"</p>
                </div>
              </CardContent>
            </Card>

            {/* Audio Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Guided Audio Experience</CardTitle>
                <CardDescription>
                  Listen to your personalized meditation or read along below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    onClick={isPlaying ? pauseAudioPlayback : startAudioPlayback}
                    disabled={!speechSynthesis}
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Play Audio
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={resetAudioPlayback}
                    disabled={!speechSynthesis}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
                
                {!speechSynthesis && (
                  <p className="text-sm text-gray-500 mt-2">
                    Audio playback is not supported in your browser. Please read the text below.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Visualization Text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Your Meditation</CardTitle>
                <CardDescription>
                  Take a comfortable position and allow yourself to be guided through this personalized visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  {visualizationParagraphs.map((paragraph, index) => (
                    <p 
                      key={index}
                      className={`mb-4 leading-relaxed text-lg ${
                        currentParagraph === index ? 'bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-4 border-blue-500' : ''
                      }`}
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Context Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Personal Context</CardTitle>
                <CardDescription>
                  This visualization was created based on your intake responses
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Goals:</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{visualizationData.intakeContext.goals}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Your Dreams:</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{visualizationData.intakeContext.dreams}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Support Sources:</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{visualizationData.intakeContext.supportSources}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Self-Care:</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{visualizationData.intakeContext.selfCareActivities}</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-6">
              <Button
                variant="outline"
                onClick={handleStartOver}
                className="flex items-center gap-2"
              >
                Start New Session
              </Button>
              
              <Button
                onClick={() => setLocation('/past-sessions')}
                className="flex items-center gap-2"
              >
                View All Sessions
              </Button>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Visualization Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We couldn't find or create a visualization for this session.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleBack} variant="outline">
                    Go Back
                  </Button>
                  <Button onClick={handleStartOver}>
                    Start New Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}