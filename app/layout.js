import '@/styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer } from 'react-toastify';
import { AuthProvider } from '@/context/authContext';
import { MapProvider } from '@/context/mapContext';

export const metadata = {
  title: 'LUWAS',
  description:
    'LGU Unified Web-based Alert System for Risk Mapping and Accident Reporting',
  icons: {
    icon: '/clarinLogo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900 font-roboto antialiased">
        <AuthProvider>
          <MapProvider>
            {children}

            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
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
