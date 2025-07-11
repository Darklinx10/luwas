// app/layout.jsx
import "@/styles/globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from '@/context/authContext';
import { HouseholdProvider } from '@/context/householdContext'; 
export const metadata = {
  title: "BMIS",
  description: "Barangay Management Information System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <HouseholdProvider> {/* ✅ Wrap here */}
            {children}
            <ToastContainer position="top-right" autoClose={3000} />
          </HouseholdProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
