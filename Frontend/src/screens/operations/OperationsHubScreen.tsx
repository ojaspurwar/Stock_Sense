import React, { useState } from 'react';
import { ReceiptsScreen } from './ReceiptsScreen';
import { DeliveriesScreen } from './DeliveriesScreen';
import { TransfersScreen } from './TransfersScreen';
import { AdjustmentsScreen } from './AdjustmentsScreen';

export interface OperationsHubScreenProps {
  initialTab?: 'receipts' | 'deliveries' | 'transfers' | 'adjustments';
  searchQuery?: string;
  filterWarehouse?: string;
}

export const OperationsHubScreen: React.FC<OperationsHubScreenProps> = ({
  initialTab = 'receipts',
  searchQuery = '',
  filterWarehouse = 'All',
}) => {
  const [activeTab, setActiveTab] = useState<'receipts' | 'deliveries' | 'transfers' | 'adjustments'>(
    initialTab
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)', minHeight: 0 }}>
      {/* Sub-navigation tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '4px 0' }}>
        <button
          className={`tab ${activeTab === 'receipts' ? 'on' : ''}`}
          onClick={() => setActiveTab('receipts')}
        >
          Receipts
        </button>
        <button
          className={`tab ${activeTab === 'deliveries' ? 'on' : ''}`}
          onClick={() => setActiveTab('deliveries')}
        >
          Delivery Orders
        </button>
        <button
          className={`tab ${activeTab === 'transfers' ? 'on' : ''}`}
          onClick={() => setActiveTab('transfers')}
        >
          Internal Transfers
        </button>
        <button
          className={`tab ${activeTab === 'adjustments' ? 'on' : ''}`}
          onClick={() => setActiveTab('adjustments')}
        >
          Stock Adjustments
        </button>
      </div>

      {activeTab === 'receipts' && (
        <ReceiptsScreen searchQuery={searchQuery} filterWarehouse={filterWarehouse} />
      )}
      {activeTab === 'deliveries' && (
        <DeliveriesScreen searchQuery={searchQuery} filterWarehouse={filterWarehouse} />
      )}
      {activeTab === 'transfers' && (
        <TransfersScreen searchQuery={searchQuery} filterWarehouse={filterWarehouse} />
      )}
      {activeTab === 'adjustments' && (
        <AdjustmentsScreen searchQuery={searchQuery} filterWarehouse={filterWarehouse} />
      )}
    </div>
  );
};
