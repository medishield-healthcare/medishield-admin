import { IndianRupee, Clock3, PackageCheck } from "lucide-react";

interface DashboardCardProps {
  title: string;
  heading: string;
  value: string;
}
export function DashboardCard({ title, heading, value }: DashboardCardProps) {
  return (
    <div className="surface metric-card">
      <span className="metric-card-icon" aria-hidden="true">
        {title === "Revenue" ? <IndianRupee size={20} /> : title === "Pending Orders" ? <Clock3 size={20} /> : <PackageCheck size={20} />}
      </span>
      <h2 className="metric-card-title">{title}</h2>
      <div className="metric-card-value">{value}</div>
      <p className="metric-card-caption">{heading}</p>
    </div>
  );
}
