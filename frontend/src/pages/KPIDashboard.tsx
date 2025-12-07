import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Star } from 'lucide-react';
import { performanceAPI } from '@/lib/api';

const timeRanges = ['Day', 'Week', 'Month', 'Quarter', 'Year'];

export function KPIDashboard() {
  const [timeRange, setTimeRange] = useState('Month');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await performanceAPI.getAll({ period: timeRange });
      if (response.success && response.data && response.data.length > 0) {
        setPerformanceData(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingStars = (score: number) => {
    if (score >= 90) return 5;
    if (score >= 80) return 4;
    if (score >= 70) return 3;
    if (score >= 60) return 2;
    return 1;
  };

  const finalScore = performanceData?.finalScore || 0;
  const kpiScore = performanceData?.kpiScore || 0;
  const behavioralScore = performanceData?.behavioralScore || 0;
  const rating = performanceData?.rating || 'N/A';
  const stars = getRatingStars(finalScore);
  const dailyData = performanceData?.dailyData || [];
  const kpiContribution = performanceData?.kpiContribution || [];
  const radarData = performanceData?.radarData || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">KPI Dashboard</h1>
          <p className="text-slate-600 mt-1">Track your performance metrics and achievements</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timeRanges.map((range) => (
              <SelectItem key={range} value={range}>
                {range}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">Final Score</p>
              <p className="text-4xl font-bold text-slate-800">{finalScore}%</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < stars ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-700 mt-2">Rating: {rating}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">KPI Score (85%)</p>
              <p className="text-4xl font-bold text-slate-800">{kpiScore}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">Behavioral Score (15%)</p>
              <p className="text-4xl font-bold text-slate-800">{behavioralScore}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">Overall Rating</p>
              <Badge variant="success" className="text-lg px-4 py-2">
                {rating}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Achievement vs Target */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Achievement vs Target</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} name="Target" />
                  <Line type="monotone" dataKey="achievement" stroke="#3b82f6" strokeWidth={2} name="Achievement" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No daily data available</div>
            )}
          </CardContent>
        </Card>

        {/* KPI Contribution */}
        <Card>
          <CardHeader>
            <CardTitle>KPI Contribution per Category</CardTitle>
          </CardHeader>
          <CardContent>
            {kpiContribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={kpiContribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 py-16">No KPI contribution data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Behavioral vs Results Score</CardTitle>
        </CardHeader>
        <CardContent>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Performance" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-slate-500 py-16">No radar chart data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

