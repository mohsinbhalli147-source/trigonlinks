import { FileX, Database, Search, BarChart3, Users, Package, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  description?: string; // alias for message
  icon?: 'empty' | 'search' | 'error' | 'BarChart3' | 'Users' | 'Package' | 'CheckCircle' | string;
  onRetry?: () => void;
}

export default function EmptyState({
  title = 'No Data Found',
  message,
  description,
  icon = 'empty',
  onRetry,
}: EmptyStateProps) {
  const text = message || description || 'No records are available yet. Data will appear here once you start adding entries.';

  const getIcon = () => {
    switch (icon) {
      case 'search': return Search;
      case 'error': return Database;
      case 'BarChart3': return BarChart3;
      case 'Users': return Users;
      case 'Package': return Package;
      case 'CheckCircle': return FileX;
      default: return FileX;
    }
  };

  const Icon = getIcon();
  const iconColor =
    icon === 'error'
      ? 'text-[#F5514B]'
      : icon === 'search'
      ? 'text-[#4C8DFF]'
      : 'text-[#8996AD]';

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className={`w-16 h-16 rounded-2xl bg-[#1B2540] flex items-center justify-center mb-4 ${iconColor}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-[#EAF0FB] mb-2">{title}</h3>
      <p className="text-sm text-[#5C6B85] max-w-sm leading-relaxed">{text}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 px-4 py-2 bg-[#232D45] hover:bg-[#2A3657] text-[#8996AD] hover:text-[#EAF0FB] rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
