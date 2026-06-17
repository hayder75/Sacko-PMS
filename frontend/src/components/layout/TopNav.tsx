import { useState, useRef, useEffect } from 'react';
import { Bell, Globe, ChevronDown, X, CheckCircle2, AlertCircle, Clock, UserPlus, TrendingUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const roleNotifications: Record<string, any[]> = {
  admin: [
    { id: 1, icon: TrendingUp, title: 'Branch Performance Update', description: 'Hawassa Main Branch achieved 92% of deposit target this month', time: '10 min ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: AlertCircle, title: 'CBS Validation Alert', description: '2 branches have discrepancies requiring review in the last 24h', time: '1 hour ago', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, icon: CheckCircle2, title: 'Plan Cascade Complete', description: 'H2-2025 plans have been cascaded to all 11 branches', time: '3 hours ago', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, icon: UserPlus, title: 'New Staff Onboarded', description: '3 new MSOs have been added to the system this week', time: '1 day ago', color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 5, icon: FileText, title: 'Monthly Report Ready', description: 'June performance report is available for download', time: '2 days ago', color: 'text-slate-600', bg: 'bg-slate-50' },
  ],
  regionalDirector: [
    { id: 1, icon: TrendingUp, title: 'South Region Performance', description: 'Region achieved 87% overall - Hawassa leading at 92%', time: '30 min ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: AlertCircle, title: 'Area Review Needed', description: 'Hawassa Area has 2 staff below 60% target', time: '2 hours ago', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, icon: CheckCircle2, title: 'Branch KPI Submission', description: 'All area managers have submitted H2 branch KPIs', time: '5 hours ago', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, icon: FileText, title: 'Quarterly Review', description: 'Q3 performance review meeting scheduled for next week', time: '1 day ago', color: 'text-purple-600', bg: 'bg-purple-50' },
  ],
  areaManager: [
    { id: 1, icon: TrendingUp, title: 'Hawassa Area Performance', description: 'Hawassa Main: 92% | Atote: 78% - Overall area: 85%', time: '1 hour ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: AlertCircle, title: 'Branch Alert', description: 'Atote branch mapping coverage dropped to 45%', time: '3 hours ago', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, icon: Clock, title: 'Pending Approvals', description: '3 staff evaluations awaiting your review', time: '6 hours ago', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, icon: UserPlus, title: 'Staff Movement', description: '2 staff transferred between branches this month', time: '2 days ago', color: 'text-purple-600', bg: 'bg-purple-50' },
  ],
  branchManager: [
    { id: 1, icon: TrendingUp, title: "Today's Achievement", description: 'Staff have deposited 45,200 ETB so far today (78% of target)', time: '15 min ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: Clock, title: 'Pending Approvals', description: '5 tasks from your team are awaiting approval', time: '1 hour ago', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, icon: CheckCircle2, title: 'CBS Upload Reminder', description: 'Upload today\'s CBS file before 5:00 PM for validation', time: '2 hours ago', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, icon: AlertCircle, title: 'KPI Performance Alert', description: 'Digital Channel Growth at 45% - needs attention this week', time: '4 hours ago', color: 'text-amber-600', bg: 'bg-amber-50' },
  ],
  lineManager: [
    { id: 1, icon: TrendingUp, title: 'Team Performance', description: 'Your team achieved 82% of daily deposit target today', time: '20 min ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: Clock, title: 'Task Approvals', description: '3 tasks from MSOs need your approval', time: '1 hour ago', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, icon: UserPlus, title: 'New Account Mapping', description: '5 new accounts mapped to your team today', time: '3 hours ago', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 4, icon: AlertCircle, title: 'Behavioral Due', description: 'Monthly behavioral evaluations due in 3 days', time: '1 day ago', color: 'text-purple-600', bg: 'bg-purple-50' },
  ],
  subTeamLeader: [
    { id: 1, icon: TrendingUp, title: 'Team Deposit Status', description: 'Sub-team collected 18,500 ETB deposits today', time: '30 min ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: Clock, title: 'Pending Review', description: '2 accounts flagged for verification', time: '2 hours ago', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 3, icon: FileText, title: 'Monthly Report', description: 'Sub-team performance summary is ready', time: '5 hours ago', color: 'text-blue-600', bg: 'bg-blue-50' },
  ],
  staff: [
    { id: 1, icon: CheckCircle2, title: 'Task Approved', description: 'Your deposit of 3,500 ETB for Amanuel G/Hiwot was approved', time: '10 min ago', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 2, icon: TrendingUp, title: 'Daily Progress', description: 'You have completed 3 of 5 daily tasks today', time: '1 hour ago', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 3, icon: AlertCircle, title: 'Account Alert', description: 'Account HAW100015 has balance dropping below threshold', time: '3 hours ago', color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 4, icon: UserPlus, title: 'New Account Mapped', description: 'Customer Birtukan Tadesse was mapped to you today', time: '5 hours ago', color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 5, icon: FileText, title: 'Scorecard Ready', description: 'Your monthly scorecard is available for review', time: '1 day ago', color: 'text-slate-600', bg: 'bg-slate-50' },
  ],
};

export function TopNav() {
  const navigate = useNavigate();
  const { currentBranch, userName, role, logout } = useUser();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const shouldShowBranch = currentBranch && 
    role !== 'admin' && 
    role !== 'areaManager';

  const notifications = role ? roleNotifications[role] || roleNotifications.staff : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-primary-100 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-slate-800">SAKO PMS</h2>
          {shouldShowBranch && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Branch:</span>
              <span className="text-sm font-medium text-slate-800">{currentBranch}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button
              className="relative p-2 hover:bg-slate-100 rounded-md transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className={`h-5 w-5 transition-colors ${showNotifications ? 'text-blue-600' : 'text-slate-600'}`} />
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notifications.length}
              </Badge>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((notif) => {
                    const Icon = notif.icon;
                    return (
                      <div
                        key={notif.id}
                        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setShowNotifications(false)}
                      >
                        <div className={`p-2 rounded-full shrink-0 ${notif.bg}`}>
                          <Icon className={`h-4 w-4 ${notif.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.description}</p>
                          <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-center">
                  <span className="text-xs text-slate-500">{notifications.length} notifications</span>
                </div>
              </div>
            )}
          </div>

          <button className="p-2 hover:bg-slate-100 rounded-md">
            <Globe className="h-5 w-5 text-slate-600" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 hover:bg-slate-100 rounded-md px-2 py-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-slate-800">{userName}</span>
              <ChevronDown className="h-4 w-4 text-slate-600" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                logout();
                navigate('/login');
              }}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
