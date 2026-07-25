import { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

export type DateFilterType = 'today' | 'lastDay' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

interface DateFilterProps {
  onFilterChange: (filterType: DateFilterType, startDate?: Date, endDate?: Date) => void;
  onRefresh?: () => void;
}

export function getDateRange(filterType: DateFilterType): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  switch (filterType) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
    case 'lastDay':
      return {
        startDate: startOfDay(subDays(now, 1)),
        endDate: endOfDay(subDays(now, 1))
      };
    case 'thisWeek':
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 })
      };
    case 'lastWeek':
      return {
        startDate: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        endDate: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      };
    case 'thisMonth':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    case 'lastMonth':
      return {
        startDate: startOfMonth(subMonths(now, 1)),
        endDate: endOfMonth(subMonths(now, 1))
      };
    case 'thisYear':
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now)
      };
    case 'custom':
    default:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
  }
}

export default function DateFilter({ onFilterChange, onRefresh }: DateFilterProps) {
  const [selectedFilter, setSelectedFilter] = useState<DateFilterType>('thisMonth');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleFilterChange = (filterType: DateFilterType) => {
    setSelectedFilter(filterType);
    const { startDate, endDate } = getDateRange(filterType);
    onFilterChange(filterType, startDate, endDate);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    const { startDate, endDate } = getDateRange(selectedFilter);
    onFilterChange(selectedFilter, startDate, endDate);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filterOptions = [
    { value: 'today', label: 'Today' },
    { value: 'lastDay', label: 'Last Day' },
    { value: 'thisWeek', label: 'This Week' },
    { value: 'lastWeek', label: 'Last Week' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
  ] as const;

  return (
    <div className="bg-[#121B2E] border border-[#232D45] rounded-xl p-6">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="w-5 h-5 text-[#5C6B85]" />
          <select
            value={selectedFilter}
            onChange={(e) => handleFilterChange(e.target.value as DateFilterType)}
            className="px-4 py-2 bg-[#1B2540] border border-[#232D45] rounded-lg text-[#EAF0FB] focus:outline-none focus:border-[#14E8B4] w-full md:w-auto"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#4C8DFF] text-[#EAF0FB] font-semibold rounded-lg hover:bg-[#5C9DFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
    </div>
  );
}
