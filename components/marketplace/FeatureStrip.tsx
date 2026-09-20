import { GraduationCap, LayoutGrid, ShieldCheck, Users, Award, Zap, Globe, Rocket, Heart, Target, BookOpen, Star } from 'lucide-react';
import './FeatureStrip.css';

export function FeatureStrip() {
  const features = [
    {
      icon: GraduationCap,
      title: 'Expert-Led Courses',
      description: 'Learn from industry professionals and real-world practitioners.',
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      icon: LayoutGrid,
      title: 'Flexible Learning',
      description: 'Study at your own pace, anytime, anywhere.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Trusted',
      description: 'Your data and payments are always protected.',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: Users,
      title: 'Supportive Community',
      description: 'Learn, share and grow with a global community.',
      gradient: 'from-orange-500 to-red-600'
    },
    {
      icon: Award,
      title: 'Industry Certificates',
      description: 'Earn recognized certificates to boost your career.',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: Zap,
      title: 'Quick Progress',
      description: 'Fast-track your learning with accelerated courses.',
      gradient: 'from-yellow-500 to-amber-600'
    },
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Access courses from anywhere in the world.',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Rocket,
      title: 'Career Growth',
      description: 'Accelerate your career with practical skills.',
      gradient: 'from-red-500 to-pink-600'
    },
    {
      icon: Heart,
      title: 'Student Support',
      description: '24/7 support to help you succeed.',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      icon: Target,
      title: 'Goal Achievement',
      description: 'Set and achieve your learning goals.',
      gradient: 'from-indigo-500 to-purple-600'
    },
    {
      icon: BookOpen,
      title: 'Rich Content',
      description: 'High-quality, engaging learning materials.',
      gradient: 'from-teal-500 to-green-600'
    },
    {
      icon: Star,
      title: 'Top Quality',
      description: 'Premium courses from verified experts.',
      gradient: 'from-amber-500 to-yellow-600'
    }
  ];

  // Duplicate features for seamless scrolling (4 copies for longer scroll)
  const scrollFeatures = [...features, ...features, ...features, ...features];

  return (
    <section className="bg-brand-bg py-8 border-b border-brand-border/40 relative z-20 overflow-hidden">
      <div className="relative">
        {/* Marquee Container */}
        <div className="flex gap-6 animate-marquee">
          {scrollFeatures.map((feature, index) => (
            <div
              key={`${feature.title}-${index}`}
              className={`flex-shrink-0 w-80 bg-gradient-to-br ${feature.gradient} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 text-white">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1 text-lg">{feature.title}</h3>
                  <p className="text-sm text-white/90 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fade effects on edges */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-brand-bg to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-brand-bg to-transparent z-10" />
      </div>
    </section>
  );
}
