import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { ArrowLeftRight, Send, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface StepCardProps {
  stepNumber: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}

function StepCard({ stepNumber, icon: Icon, title, description }: StepCardProps) {
  return (
    <Card className="bg-card text-card-foreground border border-border/70 dark:border-border/60 hover:shadow-lg transition-all duration-200 shadow-md shadow-black/8 dark:shadow-black/20 h-full">
      <CardHeader className="text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
            {stepNumber}
          </div>
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-center leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

export function HowItWorksSection() {
  const t = useTranslations('HomePage.howItWorks');

  const steps = [
    {
      stepNumber: 1,
      icon: ArrowLeftRight,
      title: t('step1.title'),
      description: t('step1.description'),
    },
    {
      stepNumber: 2,
      icon: Send,
      title: t('step2.title'),
      description: t('step2.description'),
    },
    {
      stepNumber: 3,
      icon: CreditCard,
      title: t('step3.title'),
      description: t('step3.description'),
    },
  ];

  return (
    <div className="mb-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">{t('title')}</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {steps.map(step => (
          <StepCard
            key={step.stepNumber}
            stepNumber={step.stepNumber}
            icon={step.icon}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>
    </div>
  );
}
