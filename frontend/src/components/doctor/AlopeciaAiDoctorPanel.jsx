/**
 * Doctor-only UI for hair-case YOLO analysis stored on affectedImages[].aiAnalysis
 */
export default function AlopeciaAiDoctorPanel({ apiUrl, analysis }) {
  if (!analysis || typeof analysis !== 'object') return null

  const status = analysis.status || '—'
  const diagnosis = analysis.diagnosis
  const message = analysis.message
  const reason = analysis.reason
  const detections = Array.isArray(analysis.detections) ? analysis.detections : []
  const ann = analysis.annotatedImagePath

  return (
    <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/80 p-3 text-left space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-violet-800">AI alopecia screening (doctor only)</p>
      <p className="text-sm text-slate-800">
        <span className="font-semibold">Status:</span> {status}
      </p>
      {diagnosis ? (
        <p className="text-sm text-slate-800">
          <span className="font-semibold">Model summary:</span> {diagnosis}
        </p>
      ) : null}
      {message ? <p className="text-xs text-slate-600">{message}</p> : null}
      {reason ? (
        <p className="text-xs text-amber-800">
          <span className="font-semibold">Detail:</span> {reason}
        </p>
      ) : null}
      {detections.length > 0 && (
        <ul className="text-xs text-slate-700 list-disc pl-4 space-y-0.5">
          {detections.map((d, i) => (
            <li key={i}>
              {(d.class_name != null ? d.class_name : d.className) || 'detection'}{' '}
              {d.confidence != null ? `(${(Number(d.confidence) * 100).toFixed(1)}%)` : ''}
            </li>
          ))}
        </ul>
      )}
      {ann ? (
        <a
          href={`${apiUrl}/${String(ann).replace(/\\/g, '/')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-semibold text-violet-700 hover:underline"
        >
          Open annotated overlay image
        </a>
      ) : null}
      {analysis.analyzedAt ? (
        <p className="text-[10px] text-slate-500">Analyzed {new Date(analysis.analyzedAt).toLocaleString()}</p>
      ) : null}
    </div>
  )
}
