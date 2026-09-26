import React, { useState } from 'react';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { MockStorage } from '../../services/mockStorage';
import {
  Warehouse,
  Search,
  Bell,
  User,
  Shield,
  LogOut,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { QuickSearchModal } from '../common/QuickSearchModal';

export const Navbar: React.FC = () => {
  const { selectedLocationId, setSelectedLocationId, locations } = useLocation();
  const { user, logout, switchRole } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Check low stock products for bell indicator
  const summaries = MockStorage.getProductStockSummaries(selectedLocationId);
  const lowStockItems = summaries.filter((s) => s.is_low_stock || s.is_out_of_stock);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 md:px-8 backdrop-blur-md">
        {/* Left: Location Filter Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200">
            <Warehouse className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Location:
            </span>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">All Locations (Consolidated)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Quick Search Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-100 transition-colors text-xs"
          >
            <span className="flex items-center">
              <Search className="w-3.5 h-3.5 mr-2 text-slate-400" />
              Quick search SKU, product, or order...
            </span>
            <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center space-x-3">
          {/* Mobile search trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Low Stock Alerts Notification Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Stock Alerts"
            >
              <Bell className="w-5 h-5" />
              {lowStockItems.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                  {lowStockItems.length}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white p-4 shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Inventory Alerts ({lowStockItems.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Real-time</span>
                </div>

                <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-slate-800">{item.name}</span>
                        <span
                          className={`font-mono px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            item.is_out_of_stock
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {item.is_out_of_stock ? 'OUT OF STOCK' : 'LOW STOCK'}
                        </span>
                      </div>
                      <div className="mt-1 text-slate-500 flex justify-between">
                        <span>SKU: {item.sku}</span>
                        <span className="font-mono">
                          Current: {item.total_stock} / Min: {item.min_reorder_level}
                        </span>
                      </div>
                    </div>
                  ))}
                  {lowStockItems.length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">
                      All inventory levels are healthy!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {user ? user.name.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user ? user.name : 'Guest'}
                </p>
                <div className="flex items-center space-x-1">
                  <Shield className="w-2.5 h-2.5 text-indigo-600" />
                  <span className="text-[10px] font-mono text-indigo-600 font-bold tracking-tight">
                    {user ? user.role : 'MANAGER'}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-3 shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1.5 border-b border-slate-100 mb-2">
                  <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                {/* Role Switcher */}
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </div>
                <div className="space-y-1 mb-2">
                  <button
                    onClick={() => {
                      switchRole('MANAGER');
                      setIsProfileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      user?.role === 'MANAGER'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Inventory Manager</span>
                    {user?.role === 'MANAGER' && <span className="text-[10px] font-bold">ACTIVE</span>}
                  </button>
                  <button
                    onClick={() => {
                      switchRole('STAFF');
                      setIsProfileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      user?.role === 'STAFF'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Warehouse Staff</span>
                    {user?.role === 'STAFF' && <span className="text-[10px] font-bold">ACTIVE</span>}
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center px-2 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search Modal */}
      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
