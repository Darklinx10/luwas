// app/layout.jsx

import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from '@/context/authContext';
import { MapProvider } from '@/context/mapContext';

export const metadata = {
  title: "LUWAS",
  description: "LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting",
  icons: {
    icon: [{ url: "/clarinLogo.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="flex flex-col min-h-screen">
        <AuthProvider>
          <MapProvider>
            <main className="flex-grow">
              {children}
            </main>
            <ToastContainer position="top-right" autoClose={3000} />
          </MapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
