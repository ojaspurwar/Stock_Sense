import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MobileStorage } from '../../services/storage';
import { DropdownMenu } from '../ui/DropdownMenu';

export type AppRoute =
  | 'dashboard'
  | 'products'
  | 'receipts'
  | 'deliveries'
  | 'transfers'
  | 'adjustments'
  | 'ledger'
  | 'warehouses'
  | 'profile'
  | 'ui-kit';

export interface AppShellProps {
  currentRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType?: string;
  onFilterTypeChange?: (val: string) => void;
  filterStatus?: string;
  onFilterStatusChange?: (val: string) => void;
  filterWarehouse?: string;
  onFilterWarehouseChange?: (val: string) => void;
  filterCategory?: string;
  onFilterCategoryChange?: (val: string) => void;
  onNewAction?: (action: 'receipt' | 'delivery' | 'transfer' | 'adjustment' | 'product') => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onRouteChange,
  searchQuery,
  onSearchChange,
  filterType = 'All',
  onFilterTypeChange,
  filterStatus = 'All',
  onFilterStatusChange,
  filterWarehouse = 'All',
  onFilterWarehouseChange,
  filterCategory = 'All',
  onFilterCategoryChange,
  onNewAction,
  children,
}) => {
  const { user, logout } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const [pillPos, setPillPos] = useState({ top: 0, height: 38, visible: false });

  // Update sidebar active white pill position
  useEffect(() => {
    const updatePill = () => {
      if (!navRef.current) return;
      const activeEl = navRef.current.querySelector('.side-item.active') as HTMLElement | null;
      if (activeEl) {
        setPillPos({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight || 38,
          visible: true,
        });
      } else {
        setPillPos((p) => ({ ...p, visible: false }));
      }
    };
    updatePill();
    const t = setTimeout(updatePill, 40);
    window.addEventListener('resize', updatePill);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updatePill);
    };
  }, [currentRoute]);

  // Live pending counts from storage
  const [counts, setCounts] = useState({
    receipts: 0,
    deliveries: 0,
    transfers: 0,
  });

  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [openFilterMenu, setOpenFilterMenu] = useState<string | null>(null);

  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const metrics = await MobileStorage.getDashboardMetrics();
        setCounts({
          receipts: metrics.pending_receipts,
          deliveries: metrics.pending_deliveries,
          transfers: metrics.scheduled_transfers,
        });

        const locs = await MobileStorage.getLocations();
        setWarehouses(['All', ...locs.map((l) => l.name)]);

        const prods = await MobileStorage.getProducts();
        const cats = Array.from(new Set(prods.map((p) => p.category)));
        setCategories(['All', ...cats]);
      } catch (e) {
        console.error('Error loading shell counts', e);
      }
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentRoute]);

  // Global '/' keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setNewMenuOpen(false);
        setOpenFilterMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AK';

  const roleLabel =
    user?.role === 'STAFF'
      ? 'Warehouse staff'
      : 'Inventory manager';

  return (
    <div className="app">
      {/* 220px Left Sidebar */}
      <aside className="sidebar">
        <div className="logo-tile" onClick={() => onRouteChange('dashboard')}>
          <span className="logo">stocksense.</span>
          <span className="logo-mark" aria-hidden="true">
            <i></i>
            <i className="o"></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i className="o"></i>
            <i></i>
          </span>
        </div>

        <nav className="side" ref={navRef}>
          <div
            className="side-pill"
            style={{
              transform: `translate3d(0, ${pillPos.top}px, 0)`,
              height: `${pillPos.height}px`,
              opacity: pillPos.visible ? 1 : 0,
            }}
          />
          <button
            type="button"
            className={`side-item ${currentRoute === 'dashboard' ? 'active' : ''}`}
            onClick={() => onRouteChange('dashboard')}
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`side-item ${currentRoute === 'products' ? 'active' : ''}`}
            onClick={() => onRouteChange('products')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
              <path d="M3 7l9 4 9-4M12 11v10" />
            </svg>
            <span>Products</span>
          </button>

          <div className="side-label">Operations</div>

          <button
            type="button"
            className={`side-item ${currentRoute === 'receipts' ? 'active' : ''}`}
            onClick={() => onRouteChange('receipts')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 3v12M7 10l5 5 5-5" />
              <path d="M4 20h16" />
            </svg>
            <span>Receipts</span>
            {counts.receipts > 0 && <span className="count">{counts.receipts}</span>}
          </button>

          <button
            type="button"
            className={`side-item ${currentRoute === 'deliveries' ? 'active' : ''}`}
            onClick={() => onRouteChange('deliveries')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 20V8M7 13l5-5 5 5" />
              <path d="M4 4h16" />
            </svg>
            <span>Delivery orders</span>
            {counts.deliveries > 0 && <span className="count">{counts.deliveries}</span>}
          </button>

          <button
            type="button"
            className={`side-item ${currentRoute === 'transfers' ? 'active' : ''}`}
            onClick={() => onRouteChange('transfers')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 8h15l-4-4M20 16H5l4 4" />
            </svg>
            <span>Internal transfers</span>
            {counts.transfers > 0 && <span className="count">{counts.transfers}</span>}
          </button>

          <button
            type="button"
            className={`side-item ${currentRoute === 'adjustments' ? 'active' : ''}`}
            onClick={() => onRouteChange('adjustments')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" />
              <circle cx="15" cy="6" r="2" />
              <circle cx="9" cy="12" r="2" />
              <circle cx="17" cy="18" r="2" />
            </svg>
            <span>Adjustments</span>
          </button>

          <button
            type="button"
            className={`side-item ${currentRoute === 'ledger' ? 'active' : ''}`}
            onClick={() => onRouteChange('ledger')}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>Move history</span>
          </button>

          <div className="side-label">Settings</div>

          <button
            type="button"
            className={`side-item ${currentRoute === 'warehouses' ? 'active' : ''}`}
            onClick={() => onRouteChange('warehouses')}
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 21V8l9-5 9 5v13" />
              <path d="M8 21v-7h8v7" />
            </svg>
            <span>Warehouses</span>
          </button>

          <button
            type="button"
            className={`side-item ${currentRoute === 'ui-kit' ? 'active' : ''}`}
            onClick={() => onRouteChange('ui-kit')}
          >
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>UI Kit Preview</span>
          </button>

          {/* Bottom Profile Section */}
          <div className="profile">
            <div className="me">
              <span className="av">{initials}</span>
              <div>
                <b>{user?.name || 'Arjun Kapoor'}</b>
                <span>{roleLabel}</span>
              </div>
            </div>
            <button
              type="button"
              className={`side-item ${currentRoute === 'profile' ? 'active' : ''}`}
              onClick={() => onRouteChange('profile')}
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
              </svg>
              <span>My profile</span>
            </button>
            <button
              type="button"
              className="side-item"
              onClick={logout}
            >
              <svg viewBox="0 0 24 24">
                <path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="content">
        {/* 44px Top Bar on the Sky */}
        <div className="topbar">
          <label className="search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#000C23"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={searchInputRef}
              placeholder="Search SKU or product"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <kbd>/</kbd>
          </label>

          {/* Type Filter */}
          <div
            className="fchip-sky"
            style={{ position: 'relative' }}
            onClick={() => setOpenFilterMenu(openFilterMenu === 'type' ? null : 'type')}
          >
            <small>Type</small>
            <span>{filterType}</span>
            <svg viewBox="0 0 24 24" className={`dropdown-chevron ${openFilterMenu === 'type' ? 'open' : ''}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
            <DropdownMenu
              isOpen={openFilterMenu === 'type'}
              onClose={() => setOpenFilterMenu(null)}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                background: '#fff',
                color: 'var(--ink)',
                borderRadius: 6,
                zIndex: 200,
                minWidth: 150,
                overflow: 'hidden',
              }}
            >
              {['All', 'Receipts', 'Delivery', 'Internal', 'Adjustments'].map((opt) => (
                <div
                  key={opt}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: filterType === opt ? 'var(--sky-50)' : 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterTypeChange?.(opt);
                    setOpenFilterMenu(null);
                  }}
                >
                  {opt}
                </div>
              ))}
            </DropdownMenu>
          </div>

          {/* Status Filter */}
          <div
            className="fchip-sky"
            style={{ position: 'relative' }}
            onClick={() => setOpenFilterMenu(openFilterMenu === 'status' ? null : 'status')}
          >
            <small>Status</small>
            <span>{filterStatus}</span>
            <svg viewBox="0 0 24 24" className={`dropdown-chevron ${openFilterMenu === 'status' ? 'open' : ''}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
            <DropdownMenu
              isOpen={openFilterMenu === 'status'}
              onClose={() => setOpenFilterMenu(null)}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                background: '#fff',
                color: 'var(--ink)',
                borderRadius: 6,
                zIndex: 200,
                minWidth: 150,
                overflow: 'hidden',
              }}
            >
              {['All', 'Draft', 'Waiting', 'Ready', 'Done', 'Canceled'].map((opt) => (
                <div
                  key={opt}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: filterStatus === opt ? 'var(--sky-50)' : 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterStatusChange?.(opt);
                    setOpenFilterMenu(null);
                  }}
                >
                  {opt}
                </div>
              ))}
            </DropdownMenu>
          </div>

          {/* Warehouse Filter */}
          <div
            className="fchip-sky"
            style={{ position: 'relative' }}
            onClick={() => setOpenFilterMenu(openFilterMenu === 'warehouse' ? null : 'warehouse')}
          >
            <small>Warehouse</small>
            <span>{filterWarehouse}</span>
            <svg viewBox="0 0 24 24" className={`dropdown-chevron ${openFilterMenu === 'warehouse' ? 'open' : ''}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
            <DropdownMenu
              isOpen={openFilterMenu === 'warehouse'}
              onClose={() => setOpenFilterMenu(null)}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                background: '#fff',
                color: 'var(--ink)',
                borderRadius: 6,
                zIndex: 200,
                minWidth: 160,
                overflow: 'hidden',
              }}
            >
              {warehouses.map((wh) => (
                <div
                  key={wh}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: filterWarehouse === wh ? 'var(--sky-50)' : 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterWarehouseChange?.(wh);
                    setOpenFilterMenu(null);
                  }}
                >
                  {wh}
                </div>
              ))}
            </DropdownMenu>
          </div>

          {/* Category Filter */}
          <div
            className="fchip-sky"
            style={{ position: 'relative' }}
            onClick={() => setOpenFilterMenu(openFilterMenu === 'category' ? null : 'category')}
          >
            <small>Category</small>
            <span>{filterCategory}</span>
            <svg viewBox="0 0 24 24" className={`dropdown-chevron ${openFilterMenu === 'category' ? 'open' : ''}`}>
              <path d="m6 9 6 6 6-6" />
            </svg>
            <DropdownMenu
              isOpen={openFilterMenu === 'category'}
              onClose={() => setOpenFilterMenu(null)}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 6,
                background: '#fff',
                color: 'var(--ink)',
                borderRadius: 6,
                zIndex: 200,
                minWidth: 160,
                overflow: 'hidden',
              }}
            >
              {categories.map((cat) => (
                <div
                  key={cat}
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    cursor: 'pointer',
                    background: filterCategory === cat ? 'var(--sky-50)' : 'transparent',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterCategoryChange?.(cat);
                    setOpenFilterMenu(null);
                  }}
                >
                  {cat}
                </div>
              ))}
            </DropdownMenu>
          </div>

          <div className="spacer"></div>

          {/* "+ New" Action Button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn-white"
              onClick={() => setNewMenuOpen(!newMenuOpen)}
            >
              <span>+ New</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000C23"
                strokeWidth="2.4"
                className={`dropdown-chevron ${newMenuOpen ? 'open' : ''}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <DropdownMenu
              isOpen={newMenuOpen}
              onClose={() => setNewMenuOpen(false)}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                background: '#fff',
                color: 'var(--ink)',
                borderRadius: 6,
                zIndex: 200,
                minWidth: 170,
                overflow: 'hidden',
              }}
            >
              <div
                style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--grey-100)' }}
                onClick={() => {
                  setNewMenuOpen(false);
                  onNewAction?.('product');
                }}
              >
                <b>+ New Product</b>
              </div>
              <div
                style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
                onClick={() => {
                  setNewMenuOpen(false);
                  onNewAction?.('receipt');
                }}
              >
                Receipt
              </div>
              <div
                style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
                onClick={() => {
                  setNewMenuOpen(false);
                  onNewAction?.('delivery');
                }}
              >
                Delivery Order
              </div>
              <div
                style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
                onClick={() => {
                  setNewMenuOpen(false);
                  onNewAction?.('transfer');
                }}
              >
                Internal Transfer
              </div>
              <div
                style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
                onClick={() => {
                  setNewMenuOpen(false);
                  onNewAction?.('adjustment');
                }}
              >
                Stock Adjustment
              </div>
            </DropdownMenu>
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
};
