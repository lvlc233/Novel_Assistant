type ToolDispatchCardProps = {
  title: string;
  subtitle?: string;
  payload?: unknown;
};

export default function ToolDispatchCard({ title, subtitle, payload }: ToolDispatchCardProps) {
  const payloadText = payload === undefined ? '' : JSON.stringify(payload, null, 2);
  return (
    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
      <div className="font-semibold">{title}</div>
      {subtitle ? <div className="mt-1 text-blue-700">{subtitle}</div> : null}
      {payloadText ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded bg-white/80 p-2 text-[11px] leading-5 text-blue-900">
          {payloadText}
        </pre>
      ) : null}
    </div>
  );
}
