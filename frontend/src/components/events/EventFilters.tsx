import React from 'react';
import { Input, Select } from '../ui/Input';
import { Category } from '../../types';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (catId: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  selectedDateFilter: string;
  onDateFilterChange: (dateFilter: string) => void;
  seatsAvailableOnly: boolean;
  onSeatsAvailableToggle: (checked: boolean) => void;
  categories: Category[];
  departments?: string[];
  onReset: () => void;
}

const DEFAULT_DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Data Science',
  'Mechanical Engineering',
  'Life Sciences',
  'Physics',
  'School of Management',
  'Fine Arts',
];

export const EventFilters: React.FC<EventFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDepartment,
  onDepartmentChange,
  selectedDateFilter,
  onDateFilterChange,
  seatsAvailableOnly,
  onSeatsAvailableToggle,
  categories,
  departments = DEFAULT_DEPARTMENTS,
  onReset,
}) => {
  const hasFilters =
    Boolean(searchQuery) ||
    Boolean(selectedCategory) ||
    Boolean(selectedDepartment) ||
    Boolean(selectedDateFilter) ||
    seatsAvailableOnly;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 text-left">
      {/* Category Pills Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            !selectedCategory
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          }`}
        >
          All Categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id === selectedCategory ? '' : cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Search & Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-100 items-end">
        {/* Search */}
        <div className="lg:col-span-4">
          <Input
            placeholder="Search events, keywords, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Department Filter */}
        <div className="lg:col-span-3">
          <Select
            value={selectedDepartment}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
        </div>

        {/* Date Filter */}
        <div className="lg:col-span-3">
          <Select
            value={selectedDateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
          >
            <option value="">Any Date / Upcoming</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="today">Today Only</option>
          </Select>
        </div>

        {/* Seat Availability & Reset */}
        <div className="lg:col-span-2 flex items-center justify-between sm:justify-end gap-3 h-10">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={seatsAvailableOnly}
              onChange={(e) => onSeatsAvailableToggle(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
            />
            <span className="whitespace-nowrap">Open seats</span>
          </label>

          {hasFilters && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={onReset}
              leftIcon={<X className="w-3.5 h-3.5" />}
              className="text-slate-500 hover:text-slate-900"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
