import Image from 'next/image';
import Link from 'next/link';
import { BarChart, Users, Camera, Utensils, Search, Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

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

export function Hero() {
  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <div className="w-full max-w-7xl mx-auto px-4 pt-24">
        <div className="text-center space-y-6">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            Macros
          </h1>
          <div className="space-y-4">
            <p className="text-3xl md:text-4xl text-muted-foreground font-semibold">
              Social Calorie Tracker
            </p>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Track your nutrition journey, connect with like-minded individuals, and achieve your health goals together.
            </p>
          </div>
        </div>
        
        {/* App Screenshots */}
        <div className="relative mt-16">
          <Image
            src="/screenshots.png"
            alt="Macros App Screenshots"
            width={1200}
            height={600}
            className="rounded-lg shadow-2xl"
            priority
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Everything you need to track your nutrition journey
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Utensils}
              title="USDA Food Database"
              description="Search and add foods from the comprehensive USDA database with detailed nutritional information."
            />
            <FeatureCard
              icon={Camera}
              title="Photo Sharing"
              description="Upload pictures of your meals and share your food journey with the community."
            />
            <FeatureCard
              icon={Users}
              title="Social Community"
              description="Connect with like-minded individuals, follow their progress, and share your achievements."
            />
            <FeatureCard
              icon={BarChart}
              title="Progress Tracking"
              description="Visualize your nutrition journey with beautiful charts and detailed insights."
            />
            <FeatureCard
              icon={Search}
              title="Quick Add & Search"
              description="Save and reuse frequently eaten meals for faster tracking and organization."
            />
            <FeatureCard
              icon={Share2}
              title="Real-time Updates"
              description="Stay connected with instant updates for social interactions and achievements."
            />
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-semibold">
              Ready to start your journey?
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link href="/auth/sign-up">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
