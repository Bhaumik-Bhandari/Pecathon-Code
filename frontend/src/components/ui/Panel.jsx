export default function Panel({
  title,
  description,
  action,
  id,
  className = "",
  children,
}) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-[#E7E6E1] bg-white p-5 shadow-[0_2px_10px_rgba(20,30,45,0.025)] sm:p-6 ${className}`}
    >
      {(title || description || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-base font-semibold tracking-tight text-[#182331]">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1.5 text-sm leading-6 text-[#77808B]">
                {description}
              </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {children}
    </section>
  );
}