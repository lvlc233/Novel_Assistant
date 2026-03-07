import { useEffect, useState } from 'react';

type HumanInTheLoopCardProps = {
  status: 'pending' | 'approved' | 'edited' | 'rejected';
  actionName?: string;
  args?: unknown;
  onDecision: (decision: 'approve' | 'edit' | 'reject', editedAction?: { name: string; args: unknown }) => void;
};

export default function HumanInTheLoopCard({ status, actionName, args, onDecision }: HumanInTheLoopCardProps) {
  const isPending = status === 'pending';
  const [argsText, setArgsText] = useState('');
  const [parseError, setParseError] = useState('');

  useEffect(() => {
    const nextText = args === undefined ? '{}' : JSON.stringify(args, null, 2);
    setArgsText(nextText);
    setParseError('');
  }, [args]);

  const handleEdit = () => {
    if (!actionName) {
      setParseError('缺少工具名称，无法提交修改');
      return;
    }
    try {
      const parsedArgs = JSON.parse(argsText);
      setParseError('');
      onDecision('edit', { name: actionName, args: parsedArgs });
    } catch {
      setParseError('参数 JSON 解析失败');
    }
  };

  return (
    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <div className="font-semibold">人工审核</div>
      <div className="mt-1 text-amber-800">
        {isPending ? '该工具调用需要人工决策' : `当前状态：${status}`}
      </div>
      {actionName ? <div className="mt-1 text-amber-700">工具：{actionName}</div> : null}
      {isPending ? (
        <div className="mt-2">
          <div className="mb-1 text-amber-700">可编辑参数</div>
          <textarea
            className="w-full min-h-[88px] resize-y rounded border border-amber-200 bg-white p-2 text-[11px] leading-5 text-amber-900 outline-none focus:border-amber-300"
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
          />
          {parseError ? <div className="mt-1 text-red-600">{parseError}</div> : null}
        </div>
      ) : null}
      <div className="mt-2 flex gap-2">
        <button
          disabled={!isPending}
          onClick={() => onDecision('reject')}
          className="rounded border border-red-200 bg-white px-2 py-1 text-red-600 disabled:opacity-50"
        >
          拒绝
        </button>
        <button
          disabled={!isPending}
          onClick={handleEdit}
          className="rounded border border-blue-200 bg-white px-2 py-1 text-blue-600 disabled:opacity-50"
        >
          修改后继续
        </button>
        <button
          disabled={!isPending}
          onClick={() => onDecision('approve')}
          className="rounded border border-green-200 bg-white px-2 py-1 text-green-700 disabled:opacity-50"
        >
          同意
        </button>
      </div>
    </div>
  );
}
