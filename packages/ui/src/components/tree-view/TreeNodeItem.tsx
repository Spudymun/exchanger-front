import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import { ChevronRight, ChevronDown } from 'lucide-react';
import React from 'react';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (node: TreeNode) => void;
  onToggle: (nodeId: string) => void;
  expandedNodes: Set<string>;
  levelPadding: number;
  showLines: boolean;
  checkable: boolean;
  checkedNodes: Set<string>;
  onCheck: (nodeId: string, checked: boolean) => void;
}

// Компонент для кнопки раскрытия/сворачивания
const ExpandCollapseButton: React.FC<{
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
  showLines: boolean;
}> = ({ hasChildren, isExpanded, onToggle, showLines }) => {
  return (
    <div className="w-4 h-4 flex items-center justify-center mr-1">
      {hasChildren ? (
        <button
          onClick={onToggle}
          className="w-4 h-4 flex items-center justify-center hover:bg-muted rounded-sm"
        >
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      ) : showLines ? (
        <div className="w-3 h-3" />
      ) : null}
    </div>
  );
};

// Компонент для чекбокса
const TreeNodeCheckbox: React.FC<{
  checkable: boolean;
  _nodeId: string;
  isChecked: boolean;
  isDisabled: boolean;
  onCheck: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ checkable, _nodeId, isChecked, isDisabled, onCheck }) => {
  if (!checkable) return null;

  return (
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onCheck}
      disabled={isDisabled}
      className="mr-2"
      onClick={e => e.stopPropagation()}
    />
  );
};

// Компонент для контента узла
const TreeNodeContent: React.FC<{
  node: TreeNode;
}> = ({ node }) => {
  return (
    <div className="flex items-center flex-1 min-w-0">
      {node.icon && <div className="w-4 h-4 mr-2 flex-shrink-0">{node.icon}</div>}
      <span className="truncate">{node.label}</span>
    </div>
  );
};

// Компонент для рендеринга дочерних узлов
const TreeNodeChildren: React.FC<{
  hasChildren: boolean;
  isExpanded: boolean;
  children?: TreeNode[];
  parentProps: Pick<
    TreeNodeItemProps,
    | 'onSelect'
    | 'onToggle'
    | 'expandedNodes'
    | 'levelPadding'
    | 'showLines'
    | 'checkable'
    | 'checkedNodes'
    | 'onCheck'
    | 'isSelected'
  >;
  level: number;
}> = ({ hasChildren, isExpanded, children, parentProps, level }) => {
  if (!hasChildren || !isExpanded || !children) return null;

  return (
    <div>
      {children.map(child => (
        <TreeNodeItem
          key={child.id}
          node={child}
          level={level + 1}
          {...parentProps}
          isExpanded={parentProps.expandedNodes.has(child.id)}
        />
      ))}
    </div>
  );
};

// Компонент для layout узла
const TreeNodeLayout: React.FC<{
  node: TreeNode;
  level: number;
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ node, level, isSelected, onClick, children }) => {
  const paddingLeft = level * UI_NUMERIC_CONSTANTS.TREE_LEVEL_PADDING;

  return (
    <div
      className={`
        flex items-center py-1 px-2 cursor-pointer hover:bg-muted/50 select-none
        ${isSelected ? 'bg-primary/10 text-primary' : ''}
        ${node.disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${node.className || ''}
      `}
      style={{ paddingLeft: `${paddingLeft + UI_NUMERIC_CONSTANTS.TREE_LEVEL_PADDING}px` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Хук для создания обработчиков событий
const useTreeNodeHandlers = (params: {
  node: TreeNode;
  hasChildren: boolean;
  onSelect: (node: TreeNode) => void;
  onToggle: (nodeId: string) => void;
  onCheck: (nodeId: string, checked: boolean) => void;
}) => {
  const { node, hasChildren, onSelect, onToggle, onCheck } = params;

  const handleClick = () => {
    if (!node.disabled) {
      onSelect(node);
    }
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onCheck(node.id, e.target.checked);
  };

  return { handleClick, handleToggleExpand, handleCheckChange };
};

// Основной компонент узла дерева
export const TreeNodeItem: React.FC<TreeNodeItemProps> = props => {
  const {
    node,
    level,
    isSelected,
    isExpanded,
    onSelect,
    onToggle,
    expandedNodes,
    levelPadding,
    showLines,
    checkable,
    checkedNodes,
    onCheck,
  } = props;

  const hasChildren = node.children && node.children.length > 0;
  const { handleClick, handleToggleExpand, handleCheckChange } = useTreeNodeHandlers({
    node,
    hasChildren: hasChildren || false,
    onSelect,
    onToggle,
    onCheck,
  });

  const parentProps = {
    isSelected,
    onSelect,
    onToggle,
    expandedNodes,
    levelPadding,
    showLines,
    checkable,
    checkedNodes,
    onCheck,
  };

  return (
    <>
      <TreeNodeLayout node={node} level={level} isSelected={isSelected} onClick={handleClick}>
        <ExpandCollapseButton
          hasChildren={hasChildren || false}
          isExpanded={isExpanded}
          onToggle={handleToggleExpand}
          showLines={showLines}
        />

        <TreeNodeCheckbox
          checkable={checkable}
          _nodeId={node.id}
          isChecked={checkedNodes.has(node.id)}
          isDisabled={node.disabled || false}
          onCheck={handleCheckChange}
        />

        <TreeNodeContent node={node} />
      </TreeNodeLayout>

      <TreeNodeChildren
        hasChildren={hasChildren || false}
        isExpanded={isExpanded}
        children={node.children}
        parentProps={parentProps}
        level={level}
      />
    </>
  );
};
