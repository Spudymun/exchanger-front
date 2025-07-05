'use client';

import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
}

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const TREND_COLORS = {
  UP: 'text-green-600',
  DOWN: 'text-red-600',
} as const;

const DASHBOARD_STATS = [
  {
    title: 'Total Balance',
    value: '$12,345.67',
    change: '+5.2%',
    trend: 'up' as const,
  },
  {
    title: 'Active Trades',
    value: '8',
    change: '+2',
    trend: 'up' as const,
  },
  {
    title: 'Portfolio Value',
    value: '$45,678.90',
    change: '+12.8%',
    trend: 'up' as const,
  },
  {
    title: '24h Volume',
    value: '$1,234.56',
    change: '-3.1%',
    trend: 'down' as const,
  },
];

function StatCard({ title, value, change, trend }: StatCardProps) {
  const trendIcon = trend === 'up' ? '📈' : '📉';
  const trendColor = trend === 'up' ? TREND_COLORS.UP : TREND_COLORS.DOWN;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`text-xs ${trendColor}`}>{trendIcon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${trendColor}`}>{change} from last month</p>
      </CardContent>
    </Card>
  );
}

function StatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {DASHBOARD_STATS.map(stat => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}

function FeatureShowcase() {
  const features = [
    {
      title: '✅ Parallel Routes',
      description: 'Sidebar and modal routes working simultaneously',
    },
    {
      title: '✅ Zustand State',
      description: 'Global state management with persistence',
    },
    {
      title: '✅ tRPC Ready',
      description: 'End-to-end type safety configured',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {features.map(feature => (
        <Card key={feature.title}>
          <CardHeader>
            <CardTitle className="flex items-center">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RoadmapStatus() {
  const roadmapItems = [
    { name: '✅ Parallel Routes', status: 'Completed', color: TREND_COLORS.UP },
    { name: '✅ tRPC Integration', status: 'Completed', color: TREND_COLORS.UP },
    { name: '✅ Zustand State Management', status: 'Completed', color: TREND_COLORS.UP },
    { name: '✅ Advanced i18n', status: 'Configured', color: TREND_COLORS.UP },
    { name: '🚧 CI/CD Pipeline', status: 'In Progress', color: 'text-yellow-600' },
    { name: '🚧 Monitoring', status: 'In Progress', color: 'text-yellow-600' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Enterprise Roadmap Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {roadmapItems.map(item => (
            <div key={item.name} className="flex justify-between">
              <span>{item.name}</span>
              <span className={item.color}>{item.status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full" onClick={() => onAction('New Trade')}>
          🚀 Start New Trade
        </Button>
        <Button variant="outline" className="w-full" onClick={() => onAction('View Portfolio')}>
          💼 View Portfolio
        </Button>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/dashboard/settings">⚙️ Open Settings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'New Trade':
        router.push('/dashboard/trading');
        break;
      case 'View Portfolio':
        router.push('/dashboard/portfolio');
        break;
      default:
        // eslint-disable-next-line no-console -- Error handling for unknown actions
        console.warn(`Unknown quick action: ${action}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Enterprise Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your enterprise trading dashboard. Here&apos;s your overview.
        </p>
      </div>

      <StatsGrid />
      <FeatureShowcase />
      <RoadmapStatus />
      <QuickActions onAction={handleQuickAction} />
    </div>
  );
}
