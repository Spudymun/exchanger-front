'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Zap, DollarSign, Shield, Clock, Users, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';

interface FeatureCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="h-full bg-white/50 backdrop-blur-sm border-gray-200/50 hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

const createFeatures = (t: (key: string) => string) => [
  {
    icon: Zap,
    title: t('speed.title'),
    description: t('speed.description'),
  },
  {
    icon: DollarSign,
    title: t('rates.title'),
    description: t('rates.description'),
  },
  {
    icon: Shield,
    title: t('security.title'),
    description: t('security.description'),
  },
  {
    icon: Clock,
    title: t('availability.title'),
    description: t('availability.description'),
  },
  {
    icon: Users,
    title: t('support.title'),
    description: t('support.description'),
  },
  {
    icon: CheckCircle,
    title: t('reliability.title'),
    description: t('reliability.description'),
  },
];

export function FeaturesSection() {
  const t = useTranslations('HomePage.features');
  const features = createFeatures(t);

  return (
    <section className="relative py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{t('title')}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
