'use client';

import { createContext, useContext, useState } from 'react';

const HouseholdContext = createContext();

export const HouseholdProvider = ({ children }) => {
  const [householdId, setHouseholdId] = useState(null);

  return (
    <HouseholdContext.Provider value={{ householdId, setHouseholdId }}>
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => useContext(HouseholdContext);
