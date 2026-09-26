import React from 'react';
import { NavLink, useLocation as useRouterLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  ScrollText,
  RotateCcw,
  Layers,
  Database,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useNotification } from '../../context/NotificationContext';
import { useLocation } from '../../context/LocationContext';

export const Sidebar: React.FC = () => {
  const routerLocation = useRouterLocation();
  const { toast } = useNotification();
  const { refreshLocations } = useLocation();

  // Metrics for badges
  const metrics = MockStorage.getDashboardMetrics();

  const handleResetData = () => {
    if (window.confirm('Reset all demo data back to the default factory state?')) {
      MockStorage.resetToDefaults();
      refreshLocations();
      toast('Database Reset', 'Demo data has been restored to default seeds.', 'info');
      // Trigger soft reload of state
      window.location.reload();
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/products',
      label: 'Products & Stock',
      icon: Boxes,
      badge: metrics.low_stock_count > 0 ? `${metrics.low_stock_count} Alert` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      to: '/receipts',
      label: 'Receipts (In)',
      icon: ArrowDownToLine,
      badge: metrics.pending_receipts > 0 ? `${metrics.pending_receipts}` : null,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      to: '/deliveries',
      label: 'Deliveries (Out)',
      icon: ArrowUpFromLine,
      badge: metrics.pending_deliveries > 0 ? `${metrics.pending_deliveries}` : null,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      to: '/transfers',
      label: 'Internal Transfers',
      icon: ArrowLeftRight,
      badge: metrics.scheduled_transfers > 0 ? `${metrics.scheduled_transfers}` : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      to: '/adjustments',
      label: 'Stock Adjustments',
      icon: SlidersHorizontal,
      badge: null,
    },
    {
      to: '/ledger',
      label: 'Stock Ledger',
      icon: ScrollText,
      badge: 'Audit',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between h-screen sticky top-0 z-40">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                StockSense
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600">
                Modular IMS
              </span>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Operations & Catalog
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.to === '/'
                ? routerLocation.pathname === '/'
                : routerLocation.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer info */}
      <div className="p-4 border-t border-slate-100">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 mb-3">
          <div className="flex items-center space-x-2 text-slate-700 mb-1">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold">Double-Entry Engine</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            All movements enforce double-entry audit balancing.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </aside>
  );
};
