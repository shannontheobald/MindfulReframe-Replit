import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeft, Eye, Sparkles, Heart, Loader2 } from 'lucide-react';

interface VisualizationFormData {
  specificGoal: string;
}

interface VisualizationResponse {
  visualization: string;
  duration: string;
  keyThemes: string[];
}

export default function Visualization() {
  const [, setLocation] = useLocation();
  const [generatedVisualization, setGeneratedVisualization] = useState<VisualizationResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Get URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get('sessionId');
  const reframedThought = searchParams.get('reframedThought');
  const userId = searchParams.get('userId') || '1';

  // Form for additional goal specification
  const form = useForm<VisualizationFormData>({
    defaultValues: { specificGoal: "" }
  });

  // Get user's intake responses
  const { data: intakeData } = useQuery({
    queryKey: ['intake', userId],
    queryFn: () => apiRequest(`/api/intake/${userId}`),
    enabled: !!userId,
  });

  // Get reframing session details if sessionId provided
  const { data: reframingSession } = useQuery({
    queryKey: ['reframing-session', sessionId],
    queryFn: () => apiRequest(`/api/reframing/${sessionId}?userId=${userId}`),
    enabled: !!sessionId,
  });

  // Generate visualization mutation
  const generateVisualizationMutation = useMutation({
    mutationFn: async (data: VisualizationFormData) => {
      if (!intakeData) {
        throw new Error("Intake data required for visualization generation");
      }

      const finalReframedThought = reframedThought || reframingSession?.finalReframedThought;
      
      if (!finalReframedThought) {
        throw new Error("Reframed thought required for visualization generation");
      }

      return apiRequest('/api/visualization/generate', {
        method: 'POST',
        body: {
          userId: parseInt(userId),
          intakeResponses: intakeData,
          reframedBelief: finalReframedThought,
          specificGoal: data.specificGoal
        }
      });
    },
    onSuccess: (response: VisualizationResponse) => {
      setGeneratedVisualization(response);
      toast({
        title: "Visualization Generated!",
        description: "Your personalized meditation is ready.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate visualization. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: VisualizationFormData) => {
    generateVisualizationMutation.mutate(data);
  };

  const handleBack = () => {
    if (sessionId) {
      setLocation(`/reframe?sessionId=${sessionId}&thought=${encodeURIComponent(reframedThought || '')}&distortion=&userId=${userId}`);
    } else {
      setLocation('/session');
    }
  };

  if (!intakeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect shadow-xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-charcoal mb-4">Intake Required</h2>
            <p className="text-warm-gray mb-6">
              Please complete your intake form first to generate personalized visualizations.
            </p>
            <Button onClick={() => setLocation("/intake")} className="w-full">
              Complete Intake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const finalReframedThought = reframedThought || reframingSession?.finalReframedThought;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-100 to-sage-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">Visualization Generator</h1>
                <p className="text-sm text-warm-gray">Create a personalized meditation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* Context Summary */}
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-primary" />
                <span>Your Journey Context</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {finalReframedThought && (
                <div>
                  <span className="font-medium text-charcoal">Your Reframed Belief:</span>
                  <p className="text-primary font-medium italic">"{finalReframedThought}"</p>
                </div>
              )}
              
              <div>
                <span className="font-medium text-charcoal">Your Goals & Dreams:</span>
                <div className="mt-2 space-y-1">
                  {intakeData.question2 && (
                    <p className="text-warm-gray">• {intakeData.question2}</p>
                  )}
                  {intakeData.question3 && (
                    <p className="text-warm-gray">• {intakeData.question3}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualization Generator */}
          {!generatedVisualization ? (
            <Card className="glass-effect shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-secondary" />
                  <span>Generate Your Visualization</span>
                </CardTitle>
                <p className="text-warm-gray">
                  I'll create a personalized meditation that helps you embody your new beliefs 
                  and experience what it feels like to live in alignment with your dreams.
                </p>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="specificGoal"
                      render={({ field }) => (
                        <FormItem>
                          <label className="text-sm font-medium text-charcoal">
                            Focus Area (Optional)
                          </label>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Is there a specific situation, relationship, or area of life where you'd like to practice embodying this new belief? (e.g., 'feeling confident in team meetings', 'approaching dating with self-worth', 'handling work stress')"
                              className="min-h-[80px]"
                              disabled={generateVisualizationMutation.isPending}
                            />
                          </FormControl>
                          <p className="text-xs text-warm-gray">
                            Leave blank for a general visualization based on your intake responses
                          </p>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={generateVisualizationMutation.isPending}
                      className="w-full bg-gradient-to-r from-secondary to-primary text-white font-semibold py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      {generateVisualizationMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Creating Your Visualization...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Personalized Meditation
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            /* Generated Visualization Display */
            <Card className="glass-effect shadow-lg border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Heart className="w-5 h-5" />
                  <span>Your Personalized Visualization</span>
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {generatedVisualization.duration}
                  </Badge>
                  <div className="flex flex-wrap gap-1">
                    {generatedVisualization.keyThemes.map((theme, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white/60 rounded-lg p-6 border border-green-200">
                  <div className="whitespace-pre-line text-charcoal leading-relaxed">
                    {generatedVisualization.visualization}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button
                    onClick={() => setGeneratedVisualization(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Generate Different Version
                  </Button>
                  <Button
                    onClick={() => setLocation("/session")}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary text-white"
                  >
                    Start New Journal Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
}