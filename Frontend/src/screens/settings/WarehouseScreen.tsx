import React, { useState, useEffect } from 'react';
import { MobileStorage } from '../../services/storage';
import { Location } from '../../types';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Toast } from '../../components/ui/Toast';

export const WarehouseScreen: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [targetWarehouse, setTargetWarehouse] = useState<Location | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadLocations = async () => {
    try {
      const locs = await MobileStorage.getLocations();
      setLocations(locs);
    } catch (e) {
      console.error('Error loading locations', e);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const handleAddWarehouse = async () => {
    if (!name.trim() || !code.trim()) {
      setToastMsg('Warehouse name and code are required.');
      return;
    }

    try {
      await MobileStorage.createLocation({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        type: 'WAREHOUSE',
        description: description.trim(),
      });
      setToastMsg(`Added warehouse ${name}`);
      setIsAddWarehouseOpen(false);
      setName('');
      setCode('');
      setDescription('');
      await loadLocations();
    } catch (err: any) {
      setToastMsg(err.message || 'Error creating warehouse');
    }
  };

  const handleAddLocationChip = async () => {
    if (!locationName.trim() || !targetWarehouse) return;
    try {
      await MobileStorage.createLocation({
        name: `${targetWarehouse.name} - ${locationName.trim()}`,
        code: `${targetWarehouse.code}-${locationName.trim().toUpperCase().replace(/\s+/g, '-')}`,
        type: 'RACK',
        description: `Sub-location in ${targetWarehouse.name}`,
      });
      setToastMsg(`Added location ${locationName} to ${targetWarehouse.name}`);
      setIsAddLocationOpen(false);
      setLocationName('');
      await loadLocations();
    } catch (err: any) {
      setToastMsg(err.message || 'Error adding location');
    }
  };

  // Group locations: primary warehouses vs child racks
  const warehouseList = locations.filter((l) => l.type === 'WAREHOUSE' || !l.name.includes(' - '));

  return (
    <div className="list">
      <div className="list-head" style={{ alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>
            Warehouses<span>{warehouseList.length}</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Manage warehouse buildings, production lines, racks, and dispatch bays.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsAddWarehouseOpen(true)}>
          + Add warehouse
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {warehouseList.map((wh) => {
          const subLocs = locations.filter(
            (l) => l.id !== wh.id && l.name.startsWith(wh.name)
          );

          return (
            <div key={wh.id} className="wh">
              <div className="wh-top">
                <b>{wh.name}</b>
                <Pill>{wh.code}</Pill>
              </div>
              <p>{wh.description || 'Primary warehouse facility'}</p>
              <div>
                <span className="loc">Rack A-101</span>
                <span className="loc">Rack A-102</span>
                <span className="loc">Dispatch bay</span>
                {subLocs.map((sub) => (
                  <span key={sub.id} className="loc">
                    {sub.name.replace(`${wh.name} - `, '')}
                  </span>
                ))}
                <span
                  className="loc add"
                  onClick={() => {
                    setTargetWarehouse(wh);
                    setIsAddLocationOpen(true);
                  }}
                >
                  + Location
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Warehouse Modal */}
      {isAddWarehouseOpen && (
        <Modal
          isOpen={isAddWarehouseOpen}
          onClose={() => setIsAddWarehouseOpen(false)}
          title="Add warehouse"
          subtitle="Register a new site or storage facility"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddWarehouseOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddWarehouse}>
                Save warehouse
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Warehouse Name"
              placeholder="e.g. Warehouse 3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Short Code"
              placeholder="e.g. WH3"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <Input
              label="Address / Site Description"
              placeholder="e.g. Phase 2, Industrial Area"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {/* Add Sub-Location Modal */}
      {isAddLocationOpen && (
        <Modal
          isOpen={isAddLocationOpen}
          onClose={() => setIsAddLocationOpen(false)}
          title={`Add location in ${targetWarehouse?.name}`}
          subtitle="Create a new rack, aisle, bin or bay"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsAddLocationOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleAddLocationChip}>
                Add location
              </Button>
            </>
          }
        >
          <Input
            label="Location / Rack Name"
            placeholder="e.g. Rack B-302"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
          />
        </Modal>
      )}

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
