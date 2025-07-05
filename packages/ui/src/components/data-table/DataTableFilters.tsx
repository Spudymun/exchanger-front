import { Search, Filter } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface DataTableFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const DataTableFilters: React.FC<DataTableFiltersProps> = ({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
}) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Поиск..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFilters}
        className="whitespace-nowrap"
      >
        <Filter className="h-4 w-4 mr-2" />
        {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
      </Button>
    </div>
  );
};
