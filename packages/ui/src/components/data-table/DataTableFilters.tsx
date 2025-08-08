import { Search, Filter } from 'lucide-react';
import React from 'react';

import { tableStyles } from '../../lib/shared-styles';
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
    <div className={tableStyles.filters.container}>
      <div className={tableStyles.filters.searchWrapper}>
        <Search className={tableStyles.filters.searchIcon} />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          className={tableStyles.filters.searchInput}
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleFilters}
        className={tableStyles.filters.filterButton}
      >
        <Filter className={tableStyles.filters.filterIcon} />
        {showFilters ? 'Hide filters' : 'Show filters'}
      </Button>
    </div>
  );
};
