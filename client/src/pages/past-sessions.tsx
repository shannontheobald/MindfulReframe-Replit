import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Archive } from "lucide-react";

export default function PastSessions() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full px-6 py-4 glass-effect">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-warm-gray hover:text-charcoal"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Button>
          </Link>
          <h2 className="text-xl font-semibold text-charcoal">Past Sessions</h2>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="glass-effect">
            <CardContent className="p-12">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Archive className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal mb-4">
                No sessions yet
              </h3>
              <p className="text-warm-gray text-lg mb-8">
                Your reframing journey starts with your first session. Ready to begin transforming your thoughts?
              </p>
              <Link href="/intake">
                <Button className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200">
                  Start Your First Session
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
