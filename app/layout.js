// app/layout.jsx

import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context Providers for auth and household

import { HouseholdProvider } from '@/context/householdContext';
import { AuthProvider } from '@/context/authContext';
// Page metadata including title, description, and icons
export const metadata = {
  title: "LUWAS", 
  description: "LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting",
  icons: {
    icon: [
      { url: "/clarinLogo.png", type: "image/png" },
    ],
  },
};

// Root layout that wraps all pages
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* ✅ AuthProvider makes authentication state available throughout the app */}
        <AuthProvider>

          {/* ✅ HouseholdProvider makes household-related state available app-wide */}
          <HouseholdProvider>
          
            
            <div className="flex flex-col min-h-screen">
              {/* Page content */}
              <main className="flex-grow">
                {children}
              </main>
            </div>

            {/* ✅ Display toast notifications on the top-right with 5s auto-close */}
            <ToastContainer position="top-right" autoClose={3000} />
          </HouseholdProvider>

        </AuthProvider>
      </body>
    </html>
  );
}
