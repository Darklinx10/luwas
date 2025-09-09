// app/layout.jsx

import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Context Providers for auth and map
import { AuthProvider } from '@/context/authContext';
import { MapProvider } from '@/context/mapContext'; // ✅ import MapProvider

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
        <AuthProvider>
          <MapProvider> {/* ✅ wrap with MapProvider */}
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                {children}
              </main>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
          </MapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
