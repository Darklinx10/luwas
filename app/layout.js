// app/layout.jsx

import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "@/context/authContext";
import { MapProvider } from "@/context/mapContext";

export const metadata = {
  title: "LUWAS",
  description:
    "LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting",
  icons: {
    icon: [{ url: "/clarinLogo.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Responsive scaling */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Optional: Favicons for more browsers */}
        <link rel="icon" href="/clarinLogo.png" />
      </head>
      <body className="flex flex-col min-h-screen bg-white text-gray-900 font-roboto antialiased">
        <AuthProvider>
          <MapProvider>
            <main className="flex-grow">{children}</main>
            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              pauseOnHover
              draggable
            />
          </MapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
