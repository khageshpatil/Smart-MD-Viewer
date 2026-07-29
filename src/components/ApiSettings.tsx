/**
 * API Settings Component
 * Allows users to configure their Gemini API key and view usage statistics
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle, CheckCircle, TrendingUp, DollarSign, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUsageTracker } from '@/lib/ai/usageTracker';
import { getRateLimiter } from '@/lib/ai/rateLimiter';
import type { UsageReport } from '@/lib/ai/usageTracker';

export function ApiSettings() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedApiKey, setSavedApiKey] = useState(false);
  const [usageReport, setUsageReport] = useState<UsageReport | null>(null);
  const [rateLimitStats, setRateLimitStats] = useState<any>(null);

  useEffect(() => {
    // Load existing API key (masked)
    const existing = localStorage.getItem('cortex_gemini_api_key');
    if (existing) {
      setApiKey('••••••••••••••••••••••••••••••••'); // Masked
      setSavedApiKey(true);
    }

    // Load usage stats
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const tracker = getUsageTracker();
      const report = await tracker.getUsageReport();
      setUsageReport(report);

      const limiter = getRateLimiter();
      const stats = limiter.getUsageStats();
      setRateLimitStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKey || apiKey.startsWith('••••')) {
      alert('Please enter a valid API key');
      return;
    }

    localStorage.setItem('cortex_gemini_api_key', apiKey);
    setSavedApiKey(true);
    setApiKey('••••••••••••••••••••••••••••••••'); // Mask after saving
    setShowApiKey(false);
  };

  const handleRemoveApiKey = () => {
    if (confirm('Are you sure you want to remove your API key? CORTEX will not work without it.')) {
      localStorage.removeItem('cortex_gemini_api_key');
      setApiKey('');
      setSavedApiKey(false);
    }
  };

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatNumber = (num: number) => num.toLocaleString();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold">API Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure your Gemini API key and monitor usage
        </p>
      </div>

      <Tabs defaultValue="api-key" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-key">API Key</TabsTrigger>
          <TabsTrigger value="usage">Usage Stats</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>

        {/* API Key Configuration */}
        <TabsContent value="api-key" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gemini API Key</CardTitle>
              <CardDescription>
                Your API key is stored locally in your browser. It never leaves your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Security Warning */}
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Your API key is stored in browser local storage</li>
                    <li>This is for <strong>personal use only</strong> - do not deploy publicly</li>
                    <li>Anyone with access to your browser can access the key</li>
                    <li>Consider using a restricted API key with usage limits</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* API Key Input */}
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={handleSaveApiKey}>
                    {savedApiKey ? 'Update' : 'Save'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              {/* Key Status */}
              {savedApiKey && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>API Key Configured</AlertTitle>
                  <AlertDescription>
                    Your API key is set and CORTEX is ready to use.
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2"
                      onClick={handleRemoveApiKey}
                    >
                      Remove API Key
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Statistics */}
        <TabsContent value="usage" className="space-y-4">
          {usageReport && (
            <>
              {/* Cost Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCost(usageReport.today.cost)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(usageReport.today.requests)} requests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Week</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCost(usageReport.thisWeek.cost)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(usageReport.thisWeek.requests)} requests
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCost(usageReport.thisMonth.cost)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(usageReport.thisMonth.requests)} requests
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Budget Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Tracking</CardTitle>
                  <CardDescription>Monitor your spending against configured budgets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(['daily', 'weekly', 'monthly'] as const).map((period) => {
                    const budget = usageReport.budgetStatus[period];
                    return (
                      <div key={period} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{period}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatCost(budget.used)} / {formatCost(budget.limit)} ({budget.percentage}%)
                          </span>
                        </div>
                        <Progress
                          value={budget.percentage}
                          className={budget.exceeded ? 'bg-red-200' : budget.shouldAlert ? 'bg-yellow-200' : ''}
                        />
                        {budget.exceeded && (
                          <p className="text-xs text-red-600">⚠️ Budget exceeded!</p>
                        )}
                        {budget.shouldAlert && !budget.exceeded && (
                          <p className="text-xs text-yellow-600">⚠️ Approaching budget limit</p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          )}

          {!usageReport && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No usage data yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Rate Limits */}
        <TabsContent value="rate-limits" className="space-y-4">
          {rateLimitStats && (
            <Card>
              <CardHeader>
                <CardTitle>Rate Limit Status</CardTitle>
                <CardDescription>
                  Client-side rate limiting prevents accidental API quota exhaustion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Per Minute</span>
                    <span className="text-sm text-muted-foreground">
                      {rateLimitStats.lastMinute} / {rateLimitStats.limits.perMinute} ({rateLimitStats.percentages.minute}%)
                    </span>
                  </div>
                  <Progress value={rateLimitStats.percentages.minute} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Per Hour</span>
                    <span className="text-sm text-muted-foreground">
                      {rateLimitStats.lastHour} / {rateLimitStats.limits.perHour} ({rateLimitStats.percentages.hour}%)
                    </span>
                  </div>
                  <Progress value={rateLimitStats.percentages.hour} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Per Day</span>
                    <span className="text-sm text-muted-foreground">
                      {rateLimitStats.lastDay} / {rateLimitStats.limits.perDay} ({rateLimitStats.percentages.day}%)
                    </span>
                  </div>
                  <Progress value={rateLimitStats.percentages.day} />
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Rate Limiting</AlertTitle>
                  <AlertDescription>
                    These limits reset automatically. If you hit a limit, wait a few minutes before trying again.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
