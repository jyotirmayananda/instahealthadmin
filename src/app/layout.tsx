import './globals.css';
import AdminShell from '../components/AdminShell';

export const metadata = {
  title: 'InstaHealth Admin | Full Platform Control',
  description:
    'Manage medicines, lab bookings, consultations, home nursing, patients, staff, catalog, coupons, fleet, and payouts from one admin hub.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
