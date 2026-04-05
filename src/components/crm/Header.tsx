'use client';

import React from 'react';
import { useCRMStore } from '@/store/use-crm-store';
import { Menu, Bell, LogOut, User } from 'lucide-react';

const moduleTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  inventory: 'Inventory',
  sales: 'Sales',
  invoices: 'Invoices',
  orders: 'Orders',
  shop: 'Shop Settings',
  admins: 'Admin Users',
  settings: 'Settings',
};

export default function Header() {
  const { currentModule, sidebarOpen, toggleSidebar, admin, setAdmin } = useCRMStore();
  const [showLogout, setShowLogout] = React.useState(false);

  const handleLogout = () => {
    setAdmin(null);
    localStorage.removeItem('crm-auth-storage');
    window.location.reload();
  };

  return (
    <header className="crm-header">
      <button
        onClick={toggleSidebar}
        className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Menu size={20} className="text-slate-600" />
      </button>

      <h2 className="text-lg font-semibold text-slate-800">{moduleTitles[currentModule] || 'Dashboard'}</h2>

      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-sm font-bold">
              {admin?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700">{admin?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-400 capitalize">{admin?.role || ''}</p>
            </div>
          </button>

          {showLogout && (
            <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-600 hover:bg-gray-50">
                <User size={16} />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
