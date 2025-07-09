import { Hero } from "@/components/hero";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card } from "@/components/ui/card";
import { BarChart, Users, Utensils, Camera } from "lucide-react";

function FeatureCard({ icon: Icon, title, description }: { 
  icon: React.ElementType, 
  title: string, 
  description: string 
}) {
  return (
    <Card className="p-6 flex flex-col items-center text-center space-y-4 hover:bg-accent/50 transition-colors">
      <Icon className="w-8 h-8 text-primary" />
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

export default function Index() {
  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full p-4 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-xl font-bold">
          <a href="/" className="hover:text-primary">Macros</a>
        </h1>
        <div className="flex items-center gap-4">
          <AuthButton />
          <ThemeSwitcher />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-4xl px-3 py-12">
          <Hero />
        </div>

        {/* Features Section */}
        <div className="w-full bg-accent/20 py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Macros?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FeatureCard 
                icon={BarChart}
                title="Track Your Progress"
                description="Log your daily nutrition intake and visualize your progress with beautiful charts and insights."
              />
              <FeatureCard 
                icon={Users}
                title="Social Community"
                description="Connect with like-minded individuals, share your journey, and get inspired by others' success stories."
              />
              <FeatureCard 
                icon={Utensils}
                title="Smart Food Logging"
                description="Easily search and log your meals with our comprehensive food database and quick-add features."
              />
              <FeatureCard 
                icon={Camera}
                title="Visual Food Diary"
                description="Create a visual diary of your meals with photo uploads and share your favorite healthy recipes."
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of users who are transforming their nutrition habits with Macros.
            </p>
            <a href="/auth/sign-up" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              Get Started Free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
