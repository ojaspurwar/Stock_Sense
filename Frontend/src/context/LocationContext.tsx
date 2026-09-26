import React, { createContext, useContext, useState, useEffect } from 'react';
import { Location } from '../types';
import { MockStorage } from '../services/mockStorage';

interface LocationContextType {
  selectedLocationId: string; // 'all' or location uuid
  setSelectedLocationId: (id: string) => void;
  locations: Location[];
  currentLocationName: string;
  refreshLocations: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [locations, setLocations] = useState<Location[]>([]);

  const refreshLocations = () => {
    setLocations(MockStorage.getLocations());
  };

  useEffect(() => {
    refreshLocations();
  }, []);

  const currentLocationName =
    selectedLocationId === 'all'
      ? 'All Locations'
      : locations.find((l) => l.id === selectedLocationId)?.name || 'Selected Location';

  return (
    <LocationContext.Provider
      value={{
        selectedLocationId,
        setSelectedLocationId,
        locations,
        currentLocationName,
        refreshLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
