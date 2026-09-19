import React from 'react';
import { Tag } from 'lucide-react';

interface VersionBadgeProps {
  version: string;
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'EFFECTIVE' | 'REJECTED' | 'EXPIRED';
  isCurrent?: boolean;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({
  version,
  status = 'EFFECTIVE',
  isCurrent = false,
}) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'EFFECTIVE':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'PENDING_APPROVAL':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'REJECTED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'EXPIRED':
        return 'bg-slate-100 text-slate-500 border-slate-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${getStatusStyle()}`}
    >
      <Tag className="w-3 h-3 text-current opacity-70" />
      <span>{version}</span>
      {isCurrent && (
        <span className="ml-0.5 px-1 py-0.2 text-[10px] bg-blue-700 text-white rounded">
          当前基准
        </span>
      )}
    </span>
  );
};
