import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ThemeToggle,
  layoutStyles,
  pageStyles,
  textStyles,
  combineStyles,
} from '@repo/ui';

// Константы стилей для устранения дублирования
const METRIC_VALUE_STYLES = combineStyles(pageStyles.title.section, 'font-bold');
const METRIC_DESCRIPTION_STYLES = combineStyles(textStyles.body.sm, 'text-muted-foreground');

export default function DashboardPage() {
  return (
    <div className={layoutStyles.container}>
      <div
        className={combineStyles('flex justify-between items-center', pageStyles.spacing.content)}
      >
        <div>
          <h1 className={pageStyles.title.page}>Dashboard</h1>
          <p className={pageStyles.description.page}>Welcome to your Exchanger dashboard</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exchange Rate</CardTitle>
            <CardDescription>Current market rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={METRIC_VALUE_STYLES}>$1.00 = €0.85</div>
            <p className={METRIC_DESCRIPTION_STYLES}>+2.5% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>Your current balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={METRIC_VALUE_STYLES}>$12,345.67</div>
            <p className={METRIC_DESCRIPTION_STYLES}>Available for trading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={METRIC_VALUE_STYLES}>15</div>
            <p className={METRIC_DESCRIPTION_STYLES}>Total transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className={pageStyles.spacing.section}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button>Buy Currency</Button>
            <Button variant="outline">Sell Currency</Button>
            <Button variant="secondary">View History</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
