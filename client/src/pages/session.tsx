import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Brain, Lightbulb, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const journalFormSchema = z.object({
  journalEntry: z.string().min(10, "Please write at least 10 characters to get meaningful analysis"),
  userId: z.number().optional(),
});

type JournalFormData = z.infer<typeof journalFormSchema>;

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

export default function Session() {
  const [, setLocation] = useLocation();
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const form = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      userId: 1, // Demo user ID
      journalEntry: "",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: JournalFormData) => {
      const response = await apiRequest("POST", "/api/sessions/analyze", data);
      return response.json() as Promise<AnalysisResult>;
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "I've identified some thought patterns we can work on together.",
      });
    },
    onError: (error) => {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "I had trouble analyzing your entry. Please try again or check if the AI service is available.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JournalFormData) => {
    analyzeMutation.mutate(data);
  };

  const handleSelectThought = (thought: DetectedThought) => {
    // TODO: Navigate to reframing page with selected thought
    toast({
      title: "Coming Soon",
      description: `Ready to reframe: "${thought.thought.substring(0, 50)}..."`,
    });
  };

  if (analysisResult) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="w-full px-6 py-4 glass-effect">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setAnalysisResult(null);
                form.reset();
              }}
              className="flex items-center space-x-2 text-warm-gray hover:text-charcoal"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>New Entry</span>
            </Button>
            <h2 className="text-xl font-semibold text-charcoal">Thought Analysis</h2>
          </div>
        </div>

        {/* Analysis Results */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {/* Summary */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-charcoal">
                  <Brain className="w-5 h-5 text-primary" />
                  <span>Analysis Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-warm-gray leading-relaxed">{analysisResult.summary}</p>
              </CardContent>
            </Card>

            {/* Detected Thoughts */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-charcoal">
                  <Lightbulb className="w-5 h-5 text-secondary" />
                  <span>Thoughts to Reframe</span>
                </CardTitle>
                <p className="text-warm-gray text-sm">
                  Choose a thought pattern you'd like to work on reframing.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisResult.detectedThoughts.map((thought, index) => (
                  <div
                    key={index}
                    className="p-4 border border-white/40 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => handleSelectThought(thought)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {thought.distortion}
                      </Badge>
                    </div>
                    <blockquote className="text-charcoal font-medium mb-2 italic">
                      "{thought.thought}"
                    </blockquote>
                    <p className="text-warm-gray text-sm leading-relaxed">
                      {thought.explanation}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 glass-effect"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectThought(thought);
                      }}
                    >
                      Reframe This Thought
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/")}
                className="glass-effect"
              >
                Return Home
              </Button>
            </div>
          </div>
        </main>
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
            onClick={() => setLocation("/")}
            className="flex items-center space-x-2 text-warm-gray hover:text-charcoal"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
          <h2 className="text-xl font-semibold text-charcoal">New Session</h2>
        </div>
      </div>

      {/* Journal Form */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl mx-auto w-full">
          <Card className="glass-effect shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
                  Share what's on your mind
                </h2>
                <p className="text-warm-gray text-lg leading-relaxed">
                  Write freely about your thoughts and feelings. I'll help you identify patterns and work through them together.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="journalEntry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold text-charcoal sr-only">
                          Journal Entry
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={12}
                            placeholder="Start writing about what's been on your mind lately. Share your thoughts, worries, frustrations, or anything that feels heavy. This is a safe space to express yourself honestly..."
                            className="w-full px-6 py-4 bg-white/80 border border-white/40 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary/50 resize-none text-charcoal placeholder-warm-gray/60 transition-all duration-200"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-warm-gray/80 mt-2">
                          Your entry is private and will only be used to provide you with personalized insights.
                        </p>
                      </FormItem>
                    )}
                  />

                  <div className="text-center pt-6">
                    <Button
                      type="submit"
                      disabled={analyzeMutation.isPending || !form.watch("journalEntry")?.trim()}
                      className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing your thoughts...
                        </>
                      ) : (
                        "Analyze My Thoughts"
                      )}
                    </Button>
                    <p className="text-sm text-warm-gray mt-4">
                      This may take a moment as I carefully review your entry
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}