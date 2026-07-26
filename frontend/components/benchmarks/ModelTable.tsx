import { models } from "@/lib/benchmarks";

// Model-comparison table (data-table spec). The accuracy cell carries a slim
// fill-bar so the 76%→99% spread is scannable at a glance.
export function ModelTable() {
  return (
    <div className="overflow-hidden rounded-md border border-hairline">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-body-sm">
        <thead>
          <tr className="bg-surface text-left text-caption font-semibold text-steel">
            <th className="px-4 py-3">Model</th>
            <th className="px-4 py-3">Accuracy</th>
            <th className="px-4 py-3">Notes</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr
              key={m.model}
              className={`border-t border-hairline-soft ${
                m.highlight ? "bg-brand-coral/5" : ""
              }`}
            >
              <td
                className={`px-4 py-4 ${
                  m.highlight ? "font-semibold text-ink" : "text-charcoal"
                }`}
              >
                {m.model}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-[52px] tabular-nums ${
                      m.highlight ? "font-semibold text-ink" : "text-ink"
                    }`}
                  >
                    {m.accuracy.toFixed(2)}%
                  </span>
                  <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-surface-soft sm:block">
                    <span
                      className={`block h-full rounded-full ${
                        m.highlight ? "bg-brand-coral" : "bg-stone"
                      }`}
                      style={{ width: `${m.accuracy}%` }}
                    />
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-steel">{m.note}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
