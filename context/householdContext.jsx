'use client';

import { createContext, useContext, useState } from 'react';

// Create a context to store and share household ID across components
const HouseholdContext = createContext();

// Provider component that wraps around parts of the app that need access to householdId
export const HouseholdProvider = ({ children }) => {
  const [householdId, setHouseholdId] = useState(null); // State to hold the currently selected household ID

  return (
    // Provide both the ID and the function to update it
    <HouseholdContext.Provider value={{ householdId, setHouseholdId }}>
      {children}
    </HouseholdContext.Provider>
  );
};

// Custom hook to access the household context values in any component
export const useHousehold = () => useContext(HouseholdContext);
