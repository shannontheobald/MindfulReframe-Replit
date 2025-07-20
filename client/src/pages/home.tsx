import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Heart, Eye, User } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <nav className="w-full px-6 py-4 glass-effect">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">M</span>
            </div>
            <h1 className="text-xl font-semibold text-charcoal">Mindful Reframe</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-warm-gray hover:text-charcoal">
            <User className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-charcoal mb-6 leading-tight">
              Mindful{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Reframe
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-warm-gray font-light mb-8">
              Reframe your thoughts. Rewrite your story.
            </p>
            <p className="text-lg text-warm-gray/80 max-w-2xl mx-auto leading-relaxed">
              Transform limiting beliefs into empowering thoughts through gentle,
              AI-guided reflection and visualization.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/intake">
              <Button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-200">
                Start a New Session
              </Button>
            </Link>
            <Link href="/past-sessions">
              <Button
                variant="outline"
                className="w-full sm:w-auto px-8 py-4 glass-effect text-charcoal font-semibold rounded-full hover:bg-white hover:shadow-md transition-all duration-200"
              >
                View Past Sessions
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="glass-effect glass-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">
                  Identify Patterns
                </h3>
                <p className="text-warm-gray">
                  Discover cognitive distortions in your thoughts with gentle AI analysis
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect glass-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-secondary to-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">
                  Reframe & Heal
                </h3>
                <p className="text-warm-gray">
                  Transform negative beliefs using proven CBT techniques
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect glass-hover">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-charcoal mb-2">
                  Visualize Growth
                </h3>
                <p className="text-warm-gray">
                  Practice new beliefs through personalized mental imagery
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
