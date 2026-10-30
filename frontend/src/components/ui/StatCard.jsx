const iconStyles = {
  rose: "bg-[#FBECEA] text-[#C94B43]",
  amber: "bg-[#FBF2DF] text-[#A66D16]",
  slate: "bg-[#EEF1F4] text-[#526171]",
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "slate",
}) {
  return (
    <article className="rounded-2xl border border-[#E7E6E1] bg-white p-5 shadow-[0_2px_10px_rgba(20,30,45,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-[#D9C6A6] hover:shadow-[0_10px_28px_rgba(20,30,45,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#77808B]">{title}</p>

        {Icon && (
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyles[tone] ?? iconStyles.slate}`}
          >
            <Icon size={19} strokeWidth={1.8} />
          </div>
        )}
      </div>

      <p className="mt-5 text-2xl font-semibold tracking-tight text-[#182331]">
        {value}
      </p>

      <p className="mt-1.5 text-xs leading-5 text-[#858C95]">
        {description}
      </p>
    </article>
  );
}