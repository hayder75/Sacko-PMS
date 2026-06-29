import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  email: string;
  mappedAccounts: number;
  kpiAchievement: number;
}

export function SupervisorDashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, totalMappedAccounts: 0, averageKpiAchievement: 0 });
  const [pendingApprovals, setPendingApprovals] = useState(0);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard/supervisor', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.data) {
        setTeamMembers(data.data.teamMembers || []);
        setStats(data.data.teamStats || { totalMembers: 0, totalMappedAccounts: 0, averageKpiAchievement: 0 });
      }
    } catch (_) {}

    try {
      const tasksRes = await fetch('/api/tasks?approvalStatus=Pending', { credentials: 'include' });
      const tasksData = await tasksRes.json();
      if (tasksData.success && tasksData.data) {
        setPendingApprovals(tasksData.data.length);
      }
    } catch (_) {}

    setLoading(false);
  };

  const statCards = [
    { title: 'Team Members', value: stats.totalMembers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Mapped Accounts', value: stats.totalMappedAccounts, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Avg KPI Achievement', value: `${stats.averageKpiAchievement.toFixed(1)}%`, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Pending Approvals', value: pendingApprovals, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Supervisor Dashboard</h1>
        <Button variant="outline" onClick={() => window.location.href = '/behavioral-input'}>
          Behavioral Evaluation
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.title}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No team members assigned</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Name</th>
                    <th className="text-left py-3 px-2 font-medium text-slate-600">Position</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">Mapped Accounts</th>
                    <th className="text-center py-3 px-2 font-medium text-slate-600">KPI Achievement</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-2 font-medium text-slate-800">{member.name}</td>
                      <td className="py-3 px-2 text-slate-600">{member.position}</td>
                      <td className="py-3 px-2 text-center">{member.mappedAccounts}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-medium ${member.kpiAchievement >= 100 ? 'text-emerald-600' : member.kpiAchievement >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                          {member.kpiAchievement.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
