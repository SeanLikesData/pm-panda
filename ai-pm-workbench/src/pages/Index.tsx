import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Folder, BarChart3, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex-1 bg-gradient-muted">
      <div className="flex items-center justify-center min-h-full p-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              <span className="text-primary">PMPanda</span>
              <br />
              Your AI Product Manager
              <span className="text-primary"> Teammate</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              PMPanda helps you collaborate with AI to create PRDs, technical specs, and manage your
              product roadmap. Your intelligent partner for strategic product development.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/backend-project/1">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Folder className="w-4 h-4 text-primary" />
                    Active Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/project/1/roadmap">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">Q1</p>
                  <p className="text-xs text-muted-foreground">Current focus</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/profile">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-primary" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">PM</p>
                  <p className="text-xs text-muted-foreground">Your role</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-shadow cursor-pointer">
              <Link to="/templates">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="w-4 h-4 text-primary" />
                    Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-xs text-muted-foreground">Configured</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* CTA */}
          <div className="mt-12">
            <Link to="/backend-project/1">
              <Button
                size="lg"
                className="bg-gradient-primary shadow-primary text-lg px-8 py-6 h-auto"
              >
                Start Collaborating
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              Jump into your most recent project or create a new one
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
