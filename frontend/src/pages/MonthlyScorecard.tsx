import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { performanceAPI, behavioralAPI } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

export function MonthlyScorecard() {
  const { user } = useUser();
  const [performanceScore, setPerformanceScore] = useState<any>(null);
  const [behavioralData, setBehavioralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScorecard();
  }, []);

  const loadScorecard = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const [performanceRes, behavioralRes] = await Promise.all([
        performanceAPI.getAll({
          userId: user?._id,
          period: 'Monthly',
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
        behavioralAPI.getAll({ userId: user?._id, limit: 1 }),
      ]);
      
      if (performanceRes.success && performanceRes.data && performanceRes.data.length > 0) {
        setPerformanceScore(performanceRes.data[0]);
      }
      if (behavioralRes.success && behavioralRes.data && behavioralRes.data.length > 0) {
        setBehavioralData(behavioralRes.data[0]);
      }
    } catch (error) {
      console.error('Error loading scorecard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    // In a real app, this would generate and download a PDF
    alert('PDF export functionality would be implemented here');
  };

  if (loading) {
    return <div className="text-center py-8">Loading scorecard...</div>;
  }

  const currentStaff = {
    name: user?.name || 'User',
    role: user?.role || 'Staff',
    branch: user?.branchId?.name || 'Branch',
    finalScore: performanceScore?.finalScore || 0,
    rating: performanceScore?.rating || 'N/A',
    behavioralScore: performanceScore?.behavioralScore || 0,
  };

  const kpiTotal = performanceScore?.kpiTotalScore || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Monthly Scorecard Report</h1>
          <p className="text-slate-600 mt-1">Performance evaluation and assessment</p>
        </div>
        <Button onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </Button>
      </div>

      <Card className="bg-white">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-8 border-b border-slate-200 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">SAKO Microfinance</h2>
                <p className="text-slate-600">Performance Management System</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">Report Period</p>
                <p className="font-semibold text-slate-800">December 2024</p>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Employee Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">Employee Name</p>
                <p className="font-semibold text-slate-800">{currentStaff.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Role</p>
                <p className="font-semibold text-slate-800">{currentStaff.role}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Branch</p>
                <p className="font-semibold text-slate-800">{currentStaff.branch}</p>
              </div>
            </div>
          </div>

          {/* KPI Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">KPI Breakdown</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performanceScore?.kpiScores && Object.keys(performanceScore.kpiScores).length > 0 ? (
                  Object.entries(performanceScore.kpiScores).map(([key, kpi]: [string, any]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                      </TableCell>
                      <TableCell>{kpi.target?.toLocaleString() || '-'}</TableCell>
                      <TableCell>{kpi.actual?.toLocaleString() || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={kpi.percent >= 80 ? 'success' : 'warning'}>
                          {kpi.percent || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{kpi.score?.toFixed(2) || 0}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      No KPI data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Behavioral Evaluation */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Behavioral Evaluation</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competency</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {behavioralData?.competencies && behavioralData.competencies.length > 0 ? (
                  behavioralData.competencies.map((comp: any) => (
                    <TableRow key={comp.competencyId || comp.competency}>
                      <TableCell className="font-medium">{comp.competencyName || comp.competency || 'N/A'}</TableCell>
                      <TableCell className="font-semibold">{comp.score || 0}</TableCell>
                      <TableCell>{comp.maxScore || 5}</TableCell>
                      <TableCell>
                        <Badge variant="success">
                          {comp.maxScore ? ((comp.score / comp.maxScore) * 100).toFixed(0) : 0}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                      No behavioral evaluation data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Final Score & Rating */}
          <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-2">Final Score</p>
                <p className="text-3xl font-bold text-slate-800">{currentStaff.finalScore.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-2">Overall Rating</p>
                <Badge variant="success" className="text-lg px-4 py-2">
                  {currentStaff.rating}
                </Badge>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Score Breakdown</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">KPI Score (85%): {kpiTotal.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Behavioral Score (15%): {currentStaff.behavioralScore.toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Manager Comments */}
          {behavioralData?.comments && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Manager Comments</h3>
              <div className="p-4 bg-slate-50 rounded-md border border-slate-200">
                <p className="text-sm text-slate-700">
                  {behavioralData.comments || 'No comments available'}
                </p>
                {behavioralData.approvedBy && (
                  <p className="text-xs text-slate-500 mt-2">- {behavioralData.approvedBy.name || 'Manager'}, {currentStaff.branch}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            <p>This report is generated by SAKO Performance Management System</p>
            <p className="mt-1">Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
