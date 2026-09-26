import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { injectGlobalStyles } from './src/theme/injectStyles';

import { AppShell, AppRoute } from './src/components/layout/AppShell';
import { AuthScreen } from './src/screens/auth/AuthScreen';
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { ProductsScreen } from './src/screens/products/ProductsScreen';
import { ReceiptsScreen } from './src/screens/operations/ReceiptsScreen';
import { DeliveriesScreen } from './src/screens/operations/DeliveriesScreen';
import { TransfersScreen } from './src/screens/operations/TransfersScreen';
import { AdjustmentsScreen } from './src/screens/operations/AdjustmentsScreen';
import { LedgerScreen } from './src/screens/ledger/LedgerScreen';
import { WarehouseScreen } from './src/screens/settings/WarehouseScreen';
import { ProfileScreen } from './src/screens/profile/ProfileScreen';
import { UIKitScreen } from './src/screens/ui-kit/UIKitScreen';
import { PageTransition } from './src/components/motion/PageTransition';

function MainApp() {
  const { isAuthenticated } = useAuth();

  // Route state
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterWarehouse, setFilterWarehouse] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Trigger modals from "+ New" action
  const [newActionTrigger, setNewActionTrigger] = useState<
    'product' | 'receipt' | 'delivery' | 'transfer' | 'adjustment' | null
  >(null);

  // Sync with URL hash
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (!isAuthenticated) {
        if (hash !== 'signup' && hash !== 'otp' && hash !== 'login') {
          window.location.hash = '#login';
        }
        return;
      }

      if (hash === 'products' || hash === 'new') {
        setCurrentRoute('products');
        if (hash === 'new') setNewActionTrigger('product');
      } else if (hash === 'receipts') {
        setCurrentRoute('receipts');
      } else if (hash === 'deliveries') {
        setCurrentRoute('deliveries');
      } else if (hash === 'transfers') {
        setCurrentRoute('transfers');
      } else if (hash === 'adjustments') {
        setCurrentRoute('adjustments');
      } else if (hash === 'ledger' || hash === 'history') {
        setCurrentRoute('ledger');
      } else if (hash === 'warehouses' || hash === 'settings') {
        setCurrentRoute('warehouses');
      } else if (hash === 'profile') {
        setCurrentRoute('profile');
      } else if (hash === 'ui-kit') {
        setCurrentRoute('ui-kit');
      } else if (hash === 'dashboard' || !hash || hash === 'login') {
        setCurrentRoute('dashboard');
      }
    };

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, [isAuthenticated]);

  const handleRouteChange = (route: AppRoute) => {
    setCurrentRoute(route);
    setNewActionTrigger(null);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${route}`;
    }
  };

  const handleNewAction = (
    action: 'product' | 'receipt' | 'delivery' | 'transfer' | 'adjustment'
  ) => {
    setNewActionTrigger(action);
    if (action === 'product') {
      handleRouteChange('products');
    } else if (action === 'receipt') {
      handleRouteChange('receipts');
    } else if (action === 'delivery') {
      handleRouteChange('deliveries');
    } else if (action === 'transfer') {
      handleRouteChange('transfers');
    } else if (action === 'adjustment') {
      handleRouteChange('adjustments');
    }
  };

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={() => handleRouteChange('dashboard')} />;
  }

  return (
    <AppShell
      currentRoute={currentRoute}
      onRouteChange={handleRouteChange}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      filterType={filterType}
      onFilterTypeChange={setFilterType}
      filterStatus={filterStatus}
      onFilterStatusChange={setFilterStatus}
      filterWarehouse={filterWarehouse}
      onFilterWarehouseChange={setFilterWarehouse}
      filterCategory={filterCategory}
      onFilterCategoryChange={setFilterCategory}
      onNewAction={handleNewAction}
    >
      <PageTransition currentRoute={currentRoute}>
        {currentRoute === 'dashboard' && (
          <DashboardScreen
            searchQuery={searchQuery}
            filterType={filterType}
            filterStatus={filterStatus}
            filterWarehouse={filterWarehouse}
            filterCategory={filterCategory}
            onNavigate={(target) => handleRouteChange(target as AppRoute)}
          />
        )}

        {currentRoute === 'products' && (
          <ProductsScreen
            searchQuery={searchQuery}
            filterWarehouse={filterWarehouse}
            filterCategory={filterCategory}
            openNewProductDrawer={newActionTrigger === 'product'}
            onCloseNewProductDrawer={() => setNewActionTrigger(null)}
            onNavigateToHistory={(_id) => handleRouteChange('ledger')}
          />
        )}

        {currentRoute === 'receipts' && (
          <ReceiptsScreen
            searchQuery={searchQuery}
            filterWarehouse={filterWarehouse}
            autoOpenCreate={newActionTrigger === 'receipt'}
          />
        )}

        {currentRoute === 'deliveries' && (
          <DeliveriesScreen
            searchQuery={searchQuery}
            filterWarehouse={filterWarehouse}
            autoOpenCreate={newActionTrigger === 'delivery'}
          />
        )}

        {currentRoute === 'transfers' && (
          <TransfersScreen
            searchQuery={searchQuery}
            filterWarehouse={filterWarehouse}
            autoOpenCreate={newActionTrigger === 'transfer'}
          />
        )}

        {currentRoute === 'adjustments' && (
          <AdjustmentsScreen
            searchQuery={searchQuery}
            filterWarehouse={filterWarehouse}
            autoOpenCreate={newActionTrigger === 'adjustment'}
          />
        )}

        {currentRoute === 'ledger' && (
          <LedgerScreen
            searchQuery={searchQuery}
            filterWarehouse={filterWarehouse}
          />
        )}

        {currentRoute === 'warehouses' && <WarehouseScreen />}

        {currentRoute === 'profile' && <ProfileScreen />}

        {currentRoute === 'ui-kit' && <UIKitScreen />}
      </PageTransition>
    </AppShell>
  );
}

export default function App() {
  useEffect(() => {
    injectGlobalStyles();
  }, []);

  return (
    <AuthProvider>
      <LocationProvider>
        <MainApp />
      </LocationProvider>
    </AuthProvider>
  );
}
