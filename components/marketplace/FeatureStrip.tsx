import { GraduationCap, LayoutGrid, ShieldCheck, Users } from 'lucide-react';

export function FeatureStrip() {
  const features = [
    {
      icon: GraduationCap,
      title: 'Expert-Led Courses',
      description: 'Learn from industry professionals and real-world practitioners.'
    },
    {
      icon: LayoutGrid,
      title: 'Flexible Learning',
      description: 'Study at your own pace, anytime, anywhere.'
    },
    {
      icon: ShieldCheck,
      title: 'Secure & Trusted',
      description: 'Your data and payments are always protected.'
    },
    {
      icon: Users,
      title: 'Supportive Community',
      description: 'Learn, share and grow with a global community.'
    }
  ];

  return (
    <section className="bg-gray-50 py-16 border-b border-neutral-200/40 relative z-20">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-shrink-0 text-neutral-600">
                <feature.icon className="w-6 h-6" />
              </div>
              <div className="flex-col">
                <h3 className="font-bold text-neutral-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
