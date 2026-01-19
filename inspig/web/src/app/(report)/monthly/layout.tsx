import MonthlyNavigation from '@/components/monthly/MonthlyNavigation';

export default function MonthlyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="monthly-report-container">
      <MonthlyNavigation />
      {children}
    </div>
  );
}
