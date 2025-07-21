import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, MessageCircle, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const messageFormSchema = z.object({
  message: z.string().min(1, "Please enter a message"),
});

type MessageFormData = z.infer<typeof messageFormSchema>;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ReframingSession {
  id: number;
  selectedThought: string;
  distortionType: string;
  reframingMethod: string;
  chatHistory: ChatMessage[];
  finalReframedThought?: string;
  isCompleted: boolean;
  turnCount?: number;
  maxTurns?: number;
}

interface ChatResponse {
  message: string;
  isComplete: boolean;
  finalReframedThought?: string;
  nextSuggestion?: string;
  showPacingOptions?: boolean;
  reachedTurnLimit?: boolean;
  turnCount?: number;
  maxTurns?: number;
}

// Method-specific starter prompts component
const MethodStarterPrompt = ({ method, thought }: { method: string; thought: string }) => {
  const prompts = {
    evidenceCheck: {
      title: "Evidence Check",
      prompt: `Let's examine the evidence for this thought: "${thought.substring(0, 80)}${thought.length > 80 ? '...' : ''}"
      
What specific facts or experiences support this thought? What evidence might contradict it?`
    },
    alternativePerspectives: {
      title: "Alternative Perspectives", 
      prompt: `Let's explore different ways to view this thought: "${thought.substring(0, 80)}${thought.length > 80 ? '...' : ''}"
      
How might someone else see this situation? What are other possible explanations?`
    },
    balancedThinking: {
      title: "Balanced Thinking",
      prompt: `Let's find a more balanced view of this thought: "${thought.substring(0, 80)}${thought.length > 80 ? '...' : ''}"
      
What's both realistic and hopeful about this situation? Where's the middle ground?`
    },
    compassionateSelf: {
      title: "Self-Compassion",
      prompt: `Let's approach this thought with kindness: "${thought.substring(0, 80)}${thought.length > 80 ? '...' : ''}"
      
What would you tell a dear friend who shared this exact worry? How can you show yourself the same compassion?`
    },
    actionOriented: {
      title: "Action Focus",
      prompt: `Let's focus on what you can control about this thought: "${thought.substring(0, 80)}${thought.length > 80 ? '...' : ''}"
      
What specific actions could you take? What parts of this situation are within your influence?`
    }
  };

  const methodPrompt = prompts[method as keyof typeof prompts] || prompts.evidenceCheck;

  return (
    <div className="text-left max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg border border-primary/20">
        <h4 className="font-semibold text-primary mb-2 flex items-center">
          <Sparkles className="w-4 h-4 mr-2" />
          {methodPrompt.title} Approach
        </h4>
        <p className="text-charcoal whitespace-pre-line">{methodPrompt.prompt}</p>
      </div>
      <p className="text-warm-gray text-sm mt-3 text-center">
        Share your initial thoughts to get started with this reframing approach.
      </p>
    </div>
  );
};

// Pacing Options Component
const PacingOptionsCard = ({ 
  onKeepReframing, 
  onTryDifferent, 
  onCreateVisualization,
  turnCount,
  maxTurns,
  isAtLimit 
}: {
  onKeepReframing: () => void;
  onTryDifferent: () => void;
  onCreateVisualization: () => void;
  turnCount: number;
  maxTurns: number;
  isAtLimit: boolean;
}) => (
  <Card className="glass-effect border-primary/30 max-w-2xl mx-auto">
    <CardContent className="p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-charcoal mb-2">
          {isAtLimit ? "You've reached the limit for this thought" : "How would you like to continue?"}
        </h3>
        <p className="text-warm-gray text-sm">
          {isAtLimit 
            ? `You've put thoughtful energy into shifting this belief (${turnCount}/${maxTurns} exchanges). Let's take a moment to reflect.`
            : `After ${Math.floor(turnCount / 2)} exchanges, you have these options:`
          }
        </p>
      </div>
      
      <div className="space-y-3">
        {!isAtLimit && (
          <Button
            onClick={onKeepReframing}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg transition-all"
          >
            A) Keep Reframing This Thought
          </Button>
        )}
        
        <Button
          onClick={onTryDifferent}
          variant="outline"
          className="w-full glass-effect"
        >
          {isAtLimit ? "Try a Different Thought" : "B) Reframe a Different Thought"}
        </Button>
        
        <Button
          onClick={onCreateVisualization}
          variant="outline"
          className="w-full glass-effect border-secondary/50 text-secondary hover:bg-secondary/10"
        >
          {isAtLimit ? "Create Visualization" : "C) Create Visualization"}
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Completion Summary Card
const CompletionSummaryCard = ({ 
  originalThought, 
  distortion, 
  finalReframe 
}: {
  originalThought: string;
  distortion: string;
  finalReframe: string;
}) => (
  <Card className="glass-effect border-green-200 bg-green-50/50 max-w-2xl mx-auto mb-4">
    <CardContent className="p-6">
      <div className="flex items-center mb-4">
        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
        <h3 className="text-lg font-semibold text-green-800">Reframing Complete</h3>
      </div>
      
      <div className="space-y-3">
        <div>
          <span className="font-medium text-charcoal">Original Thought:</span>
          <p className="text-warm-gray italic">"{originalThought}"</p>
        </div>
        
        <div>
          <span className="font-medium text-charcoal">Pattern Identified:</span>
          <Badge variant="outline" className="ml-2">{distortion}</Badge>
        </div>
        
        <div>
          <span className="font-medium text-charcoal">Your New Perspective:</span>
          <p className="text-green-700 font-medium">"{finalReframe}"</p>
        </div>
      </div>
      
      <p className="text-sm text-green-600 mt-4 italic">
        "You've done great work on this thought - Here's what you're learning to believe instead."
      </p>
    </CardContent>
  </Card>
);

export default function Reframe() {
  const [, setLocation] = useLocation();
  const [reframingSessionId, setReframingSessionId] = useState<number | null>(null);
  const [reframingMethod, setReframingMethod] = useState<string>('evidenceCheck');
  const [showPacingOptions, setShowPacingOptions] = useState(false);
  const [currentTurnCount, setCurrentTurnCount] = useState(0);
  const [maxTurns, setMaxTurns] = useState(12);
  const [completionSummary, setCompletionSummary] = useState<{
    originalThought: string;
    distortion: string;
    finalReframe: string;
  } | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('sessionId');
  const thought = searchParams.get('thought');
  const distortion = searchParams.get('distortion');
  const userId = searchParams.get('userId') || '1';

  // Form for sending messages
  const form = useForm<MessageFormData>({
    defaultValues: { message: "" }
  });

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Start reframing session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !thought || !distortion) {
        throw new Error("Missing required parameters");
      }

      return apiRequest('/api/reframing/start', {
        method: 'POST',
        body: {
          journalSessionId: parseInt(sessionId),
          userId: parseInt(userId),
          selectedThought: thought,
          distortionType: distortion,
          reframingMethod: reframingMethod
        }
      });
    },
    onSuccess: (data) => {
      setReframingSessionId(data.sessionId);
      toast({
        title: "Reframing Started",
        description: "Let's work together to reframe this thought.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Start",
        description: "Could not start the reframing session. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get reframing session details
  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['reframing-session', reframingSessionId],
    queryFn: () => apiRequest(`/api/reframing/${reframingSessionId}?userId=${userId}`),
    enabled: !!reframingSessionId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!reframingSessionId) throw new Error("No active session");
      
      return apiRequest(`/api/reframing/${reframingSessionId}/chat`, {
        method: 'POST',
        body: {
          message,
          userId: parseInt(userId)
        }
      });
    },
    onSuccess: async (response: ChatResponse) => {
      form.reset();
      await refetchSession();

      // Update turn tracking
      if (response.turnCount !== undefined) {
        setCurrentTurnCount(response.turnCount);
      }
      if (response.maxTurns !== undefined) {
        setMaxTurns(response.maxTurns);
      }

      // Handle pacing options
      if (response.showPacingOptions || response.reachedTurnLimit) {
        setShowPacingOptions(true);
      }
      
      // Handle completion
      if (response.isComplete && response.finalReframedThought) {
        setCompletionSummary({
          originalThought: thought || '',
          distortion: distortion || '',
          finalReframe: response.finalReframedThought
        });
        
        toast({
          title: "Reframing Complete!",
          description: "You've successfully reframed this thought. Great work!",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Message Failed",
        description: error.message || "Could not send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Pacing options handlers
  const handleKeepReframing = () => {
    setShowPacingOptions(false);
  };

  const handleTryDifferent = () => {
    // Go back to session page to select a different thought
    setLocation(`/session`);
  };

  const handleCreateVisualization = () => {
    // Navigate to visualization page (to be implemented)
    toast({
      title: "Visualization Coming Soon",
      description: "This feature will be available in the next update.",
    });
  };

  // Don't auto-start session - let user choose method first

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [session?.chatHistory]);

  const onSubmit = (data: MessageFormData) => {
    sendMessageMutation.mutate(data.message);
  };

  const reframingMethods = {
    evidenceCheck: {
      name: "Evidence Check",
      description: "Look for facts that support or contradict this thought",
      icon: "🔍"
    },
    alternativePerspectives: {
      name: "Alternative Views",
      description: "Consider other ways to view this situation",
      icon: "👀"
    },
    balancedThinking: {
      name: "Balanced Thinking",
      description: "Find a more nuanced, realistic perspective",
      icon: "⚖️"
    },
    compassionateSelf: {
      name: "Self-Compassion",
      description: "How would you speak to a good friend?",
      icon: "💖"
    },
    actionOriented: {
      name: "Action Focus",
      description: "What can you actually control here?",
      icon: "🎯"
    }
  };

  if (!sessionId || !thought || !distortion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect shadow-xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-charcoal mb-4">Missing Information</h2>
            <p className="text-warm-gray mb-6">
              This page requires a thought to reframe. Please start from your journal analysis.
            </p>
            <Button onClick={() => setLocation("/session")} className="w-full">
              Go to Journal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="w-full px-6 py-4 glass-effect">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-warm-gray hover:text-charcoal"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
          <h2 className="text-xl font-semibold text-charcoal">Reframe Your Thought</h2>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 py-8">
        <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-6">
          
          {/* Thought Card */}
          <Card className="glass-effect shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span>Selected Thought</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-charcoal font-medium italic">"{thought}"</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {distortion}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reframing Method Selection */}
          {!reframingSessionId && (
            <Card className="glass-effect shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  <span>Choose Your Reframing Method</span>
                </CardTitle>
                <p className="text-sm text-warm-gray mt-2">
                  Select the approach that feels most helpful for examining this thought:
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(reframingMethods).map(([key, method]) => (
                    <button
                      key={key}
                      onClick={() => setReframingMethod(key)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        reframingMethod === key
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-xl">{method.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{method.name}</div>
                          <div className="text-xs text-warm-gray mt-1">{method.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="pt-4 flex justify-center">
                  <Button
                    onClick={() => startSessionMutation.mutate()}
                    disabled={startSessionMutation.isPending}
                    className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    {startSessionMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Starting Session...
                      </>
                    ) : (
                      <>Start Reframing with {reframingMethods[reframingMethod as keyof typeof reframingMethods]?.name}</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Interface */}
          {reframingSessionId && session && (
            <Card className="glass-effect shadow-lg flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span>Reframing Chat</span>
                  </div>
                  {session.isCompleted && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-warm-gray">
                  Using: {reframingMethods[session.reframingMethod as keyof typeof reframingMethods]?.name}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                
                {/* Messages */}
                <div className="flex-1 max-h-96 overflow-y-auto pr-4">
                  <div className="space-y-4">
                    {session.chatHistory?.length === 0 && (
                      <div className="text-center py-8">
                        <MethodStarterPrompt 
                          method={session.reframingMethod} 
                          thought={session.selectedThought}
                        />
                      </div>
                    )}
                    
                    {session.chatHistory?.map((message: ChatMessage, index: number) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-white'
                              : 'bg-white text-charcoal shadow-sm border'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.role === 'assistant' && (
                            <p className="text-xs opacity-70 mt-1">Reframe</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Completion Summary */}
                {completionSummary && (
                  <CompletionSummaryCard
                    originalThought={completionSummary.originalThought}
                    distortion={completionSummary.distortion}
                    finalReframe={completionSummary.finalReframe}
                  />
                )}

                {/* Pacing Options */}
                {showPacingOptions && !session.isCompleted && (
                  <PacingOptionsCard
                    onKeepReframing={handleKeepReframing}
                    onTryDifferent={handleTryDifferent}
                    onCreateVisualization={handleCreateVisualization}
                    turnCount={currentTurnCount}
                    maxTurns={maxTurns}
                    isAtLimit={currentTurnCount >= maxTurns}
                  />
                )}

                {/* Final Reframed Thought */}
                {session.isCompleted && session.finalReframedThought && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-800 mb-2">Your Reframed Thought:</h4>
                      <p className="text-green-700 italic">"{session.finalReframedThought}"</p>
                    </CardContent>
                  </Card>
                )}

                {/* Message Input */}
                {!session.isCompleted && !showPacingOptions && (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex space-x-2">
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Share your thoughts..."
                                className="min-h-[60px] resize-none"
                                disabled={sendMessageMutation.isPending}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={sendMessageMutation.isPending}
                        className="self-end px-6"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}

                {/* Progress indicator */}
                {currentTurnCount > 0 && !session.isCompleted && (
                  <div className="text-center text-xs text-warm-gray">
                    Exchange {Math.ceil(currentTurnCount / 2)} of {Math.ceil(maxTurns / 2)}
                  </div>
                )}

                {session.isCompleted && (
                  <div className="text-center pt-4">
                    <Button
                      onClick={() => setLocation("/session")}
                      className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Start New Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}


        </div>
      </main>
    </div>
  );
}