const statusStyles = {
  ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  waiting: "bg-amber-50 text-amber-800 ring-amber-200",
  later: "bg-slate-100 text-slate-600 ring-slate-200",
  progress: "bg-blue-50 text-blue-700 ring-blue-200",
};

export default function StatusBadge({ status = "later", children }) {
  const styles = statusStyles[status] ?? statusStyles.later;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}