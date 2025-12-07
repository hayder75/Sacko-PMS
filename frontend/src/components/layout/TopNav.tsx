import { Bell, Globe, ChevronDown } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function TopNav() {
  const { currentBranch, userName, role, logout } = useUser();
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Only show branch for roles that have a branch (not Admin or areaManager)
  const shouldShowBranch = currentBranch && 
    role !== 'admin' && 
    role !== 'areaManager';

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200 bg-white">
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
          <button className="relative p-2 hover:bg-slate-100 rounded-md">
            <Bell className="h-5 w-5 text-slate-600" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </button>

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
              <DropdownMenuItem onClick={() => window.location.href = '/settings'}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                logout();
                window.location.href = '/login';
              }}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

