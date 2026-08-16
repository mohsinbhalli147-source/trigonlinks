import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  itemName?: string;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  itemName = 'items',
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="px-4 py-3 border-t border-[#232D45] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-[#5C6B85]">
          Showing <span className="font-semibold text-[#EAF0FB]">{start}-{end}</span> of <span className="font-semibold text-[#EAF0FB]">{total}</span> {itemName}
        </span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-[#1B2540] border border-[#232D45] text-[#EAF0FB] text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-[#14E8B4]"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 text-[#8996AD] hover:text-[#EAF0FB] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {totalPages > 0 && (
          <span className="text-[#EAF0FB] font-semibold px-2">
            Page {page} of {totalPages}
          </span>
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="p-2 text-[#8996AD] hover:text-[#EAF0FB] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
