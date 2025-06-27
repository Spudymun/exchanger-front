import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ThemeToggle } from "@repo/ui";

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome to your Exchanger dashboard
                    </p>
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
                        <div className="text-2xl font-bold">$1.00 = €0.85</div>
                        <p className="text-sm text-muted-foreground">+2.5% from yesterday</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Portfolio</CardTitle>
                        <CardDescription>Your current balance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$12,345.67</div>
                        <p className="text-sm text-muted-foreground">Available for trading</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Trades</CardTitle>
                        <CardDescription>Last 24 hours</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">15</div>
                        <p className="text-sm text-muted-foreground">Total transactions</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8">
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
