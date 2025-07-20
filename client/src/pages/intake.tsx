import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const intakeFormSchema = z.object({
  userId: z.number().optional(),
  question1: z.string().min(10, "Please provide a thoughtful response (at least 10 characters)"),
  question2: z.string().min(10, "Please provide a thoughtful response (at least 10 characters)"),
  question3: z.string().min(10, "Please provide a thoughtful response (at least 10 characters)"),
  question4: z.string().min(10, "Please provide a thoughtful response (at least 10 characters)"),
  question5: z.string().min(10, "Please provide a thoughtful response (at least 10 characters)"),
});

type IntakeFormData = z.infer<typeof intakeFormSchema>;

export default function Intake() {
  const [, setLocation] = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<IntakeFormData>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: {
      userId: 1, // For demo purposes, using user ID 1
      question1: "",
      question2: "",
      question3: "",
      question4: "",
      question5: "",
    },
  });

  const createIntakeMutation = useMutation({
    mutationFn: async (data: IntakeFormData) => {
      const response = await apiRequest("POST", "/api/intake", data);
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      toast({
        title: "Success!",
        description: "Your responses have been saved. You're ready to start your journey.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const watchedValues = form.watch();
  const filledCount = Object.values(watchedValues).filter(
    (value) => typeof value === "string" && value.trim().length > 0
  ).length - 1; // Subtract 1 for userId
  const progress = (filledCount / 5) * 100;

  const onSubmit = (data: IntakeFormData) => {
    createIntakeMutation.mutate(data);
  };

  const questions = [
    {
      name: "question1" as const,
      label: "What's been weighing on you personally lately? What thoughts or feelings keep repeating?",
      placeholder: "Share what's been on your mind. These could be recurring worries, self-doubt, or any persistent thoughts that feel heavy...",
    },
    {
      name: "question2" as const,
      label: "In your work or daily responsibilities, what's been making you feel stuck, frustrated, or uncertain?",
      placeholder: "Think about challenges in your work life, career, or daily routines. What patterns keep you feeling stuck or overwhelmed...",
    },
    {
      name: "question3" as const,
      label: "If your inner critic went quiet, what would your ideal life look and feel like?",
      placeholder: "Imagine your life without self-doubt and negative self-talk. What would you pursue? How would you feel? What would change...",
    },
    {
      name: "question4" as const,
      label: "What brings you joy—or used to? What do you long to spend more time on?",
      placeholder: "Consider activities, people, or experiences that light you up. What have you been putting off or neglecting that you'd love to return to...",
    },
    {
      name: "question5" as const,
      label: "What truly matters to you in how you live, relate, and show up in the world?",
      placeholder: "Reflect on your core values and what kind of person you want to be. How do you want to impact others and the world around you...",
    },
  ];

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <Card className="max-w-md mx-auto glass-effect">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-charcoal mb-4">
              Welcome to your journey!
            </h3>
            <p className="text-warm-gray mb-6">
              Your responses have been saved. You're ready to start your first reframing session.
            </p>
            <Button 
              className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg transition-all duration-200"
              onClick={() => setLocation("/")}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress Header */}
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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-warm-gray">Getting to know you</span>
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl mx-auto w-full">
          <Card className="glass-effect shadow-xl">
            <CardContent className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
                  Let's get to know you
                </h2>
                <p className="text-warm-gray text-lg leading-relaxed">
                  These questions help us personalize your journey. Take your time and be honest—there are no wrong answers.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {questions.map((question, index) => (
                    <FormField
                      key={question.name}
                      control={form.control}
                      name={question.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-lg font-semibold text-charcoal">
                            {question.label}
                            <span className="text-red-400 ml-1">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder={question.placeholder}
                              className="w-full px-6 py-4 bg-white/80 border border-white/40 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary/50 resize-none text-charcoal placeholder-warm-gray/60 transition-all duration-200"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  <div className="text-center pt-8">
                    <Button
                      type="submit"
                      disabled={createIntakeMutation.isPending || filledCount < 5}
                      className="w-full sm:w-auto px-12 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createIntakeMutation.isPending ? "Saving..." : "Complete Setup"}
                    </Button>
                    <p className="text-sm text-warm-gray mt-4">
                      All fields are required to personalize your experience
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
