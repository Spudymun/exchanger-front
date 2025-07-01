import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import React from 'react';

import { cn } from '../lib/utils';

// Constants for magic numbers
const TREE_LEVEL_PADDING = 16;
const ICON_SIZE = 'h-3 w-3';
const CONTAINER_ICON_SIZE = 'h-4 w-4';

export interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: React.ReactNode;
  data?: unknown;
  disabled?: boolean;
}

export interface TreeViewProps {
  data: TreeNode[];
  onSelect?: (node: TreeNode) => void;
  selectedId?: string;
  expandedIds?: string[];
  onToggle?: (nodeId: string, expanded: boolean) => void;
  className?: string;
  showIcons?: boolean;
  defaultExpandAll?: boolean;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect?: (node: TreeNode) => void;
  onToggle?: (nodeId: string, expanded: boolean) => void;
  showIcons?: boolean;
}

// Tree item expand/collapse button component
function TreeToggleButton({
  hasChildren,
  isExpanded,
  onToggle,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  if (!hasChildren) {
    return <div className="w-3 h-3" />;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="hover:bg-muted rounded p-0.5 transition-colors"
    >
      {isExpanded ? <ChevronDown className={ICON_SIZE} /> : <ChevronRight className={ICON_SIZE} />}
    </button>
  );
}

// Tree item icon component
function TreeItemIcon({
  showIcons,
  hasChildren,
  customIcon,
}: {
  showIcons: boolean;
  hasChildren: boolean;
  customIcon?: React.ReactNode;
}) {
  if (!showIcons) return null;

  return (
    <div
      className={`${CONTAINER_ICON_SIZE} mr-2 flex items-center justify-center text-muted-foreground`}
    >
      {customIcon ||
        (hasChildren ? <Folder className={ICON_SIZE} /> : <File className={ICON_SIZE} />)}
    </div>
  );
}

// Tree item content component
function TreeItemContent({
  node,
  level,
  isSelected,
  hasChildren,
  showIcons,
  onToggle,
  isExpanded,
}: {
  node: TreeNode;
  level: number;
  isSelected: boolean;
  hasChildren: boolean;
  showIcons: boolean;
  onToggle: (e: React.MouseEvent) => void;
  isExpanded: boolean;
}) {
  const paddingClass = `pl-[${level * TREE_LEVEL_PADDING}px]`;

  return (
    <div
      className={cn(
        'flex items-center py-1 px-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md transition-colors',
        paddingClass,
        isSelected && 'bg-accent text-accent-foreground',
        node.disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className={`${CONTAINER_ICON_SIZE} mr-1 flex items-center justify-center`}>
        <TreeToggleButton hasChildren={hasChildren} isExpanded={isExpanded} onToggle={onToggle} />
      </div>

      <TreeItemIcon showIcons={showIcons} hasChildren={hasChildren} customIcon={node.icon} />

      <span className="flex-1 truncate">{node.label}</span>
    </div>
  );
}

// Tree children renderer
function TreeChildren({
  hasChildren,
  isExpanded,
  nodeChildren,
  level,
  onSelect,
  onToggle,
  showIcons,
}: {
  hasChildren: boolean;
  isExpanded: boolean;
  nodeChildren?: TreeNode[];
  level: number;
  onSelect?: (node: TreeNode) => void;
  onToggle?: (nodeId: string, expanded: boolean) => void;
  showIcons: boolean;
}) {
  if (!hasChildren || !isExpanded || !nodeChildren) return null;

  return (
    <div>
      {nodeChildren.map(child => (
        <TreeItemContainer
          key={child.id}
          node={child}
          level={level + 1}
          onSelect={onSelect}
          onToggle={onToggle}
          showIcons={showIcons}
        />
      ))}
    </div>
  );
}

function TreeItem({
  node,
  level,
  isExpanded,
  isSelected,
  onSelect,
  onToggle,
  showIcons = true,
}: TreeItemProps) {
  const hasChildren = Boolean(node.children && node.children.length > 0);

  const handleClick = React.useCallback(() => {
    if (!node.disabled) {
      onSelect?.(node);
    }
  }, [node, onSelect]);

  const handleToggle = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (hasChildren) {
        onToggle?.(node.id, !isExpanded);
      }
    },
    [hasChildren, node.id, isExpanded, onToggle]
  );

  return (
    <div>
      <div onClick={handleClick}>
        <TreeItemContent
          node={node}
          level={level}
          isSelected={isSelected}
          hasChildren={hasChildren}
          showIcons={showIcons}
          onToggle={handleToggle}
          isExpanded={isExpanded}
        />
      </div>

      <TreeChildren
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        nodeChildren={node.children}
        level={level}
        onSelect={onSelect}
        onToggle={onToggle}
        showIcons={showIcons}
      />
    </div>
  );
}

interface TreeItemContainerProps {
  node: TreeNode;
  level: number;
  onSelect?: (node: TreeNode) => void;
  onToggle?: (nodeId: string, expanded: boolean) => void;
  showIcons?: boolean;
}

function TreeItemContainer({ node, level, onSelect, onToggle, showIcons }: TreeItemContainerProps) {
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = React.useState<string>();

  const handleSelect = React.useCallback(
    (selectedNode: TreeNode) => {
      setSelectedId(selectedNode.id);
      onSelect?.(selectedNode);
    },
    [onSelect]
  );

  const handleToggle = React.useCallback(
    (nodeId: string, expanded: boolean) => {
      const newExpandedIds = new Set(expandedIds);
      if (expanded) {
        newExpandedIds.add(nodeId);
      } else {
        newExpandedIds.delete(nodeId);
      }
      setExpandedIds(newExpandedIds);
      onToggle?.(nodeId, expanded);
    },
    [expandedIds, onToggle]
  );

  return (
    <TreeItem
      node={node}
      level={level}
      isExpanded={expandedIds.has(node.id)}
      isSelected={selectedId === node.id}
      onSelect={handleSelect}
      onToggle={handleToggle}
      showIcons={showIcons}
    />
  );
}

// Hook for managing tree view state
function useTreeViewState(
  data: TreeNode[],
  selectedId?: string,
  controlledExpandedIds?: string[],
  defaultExpandAll = false
) {
  const [internalExpandedIds, setInternalExpandedIds] = React.useState<Set<string>>(
    new Set(defaultExpandAll ? getAllNodeIds(data) : [])
  );
  const [internalSelectedId, setInternalSelectedId] = React.useState<string>();

  const isControlled = controlledExpandedIds !== undefined;
  const expandedIds = isControlled ? new Set(controlledExpandedIds) : internalExpandedIds;
  const currentSelectedId = selectedId ?? internalSelectedId;

  return {
    expandedIds,
    currentSelectedId,
    setInternalExpandedIds,
    setInternalSelectedId,
    isControlled,
  };
}

// Tree node list component
function TreeNodeList({
  data,
  expandedIds,
  currentSelectedId,
  showIcons,
  onSelect,
  onToggle,
}: {
  data: TreeNode[];
  expandedIds: Set<string>;
  currentSelectedId?: string;
  showIcons: boolean;
  onSelect: (node: TreeNode) => void;
  onToggle: (nodeId: string, expanded: boolean) => void;
}) {
  return (
    <>
      {data.map(node => (
        <TreeItem
          key={node.id}
          node={node}
          level={0}
          isExpanded={expandedIds.has(node.id)}
          isSelected={currentSelectedId === node.id}
          onSelect={onSelect}
          onToggle={onToggle}
          showIcons={showIcons}
        />
      ))}
    </>
  );
}

export function TreeView({
  data,
  onSelect,
  selectedId,
  expandedIds: controlledExpandedIds,
  onToggle,
  className,
  showIcons = true,
  defaultExpandAll = false,
}: TreeViewProps) {
  const {
    expandedIds,
    currentSelectedId,
    setInternalExpandedIds,
    setInternalSelectedId,
    isControlled,
  } = useTreeViewState(data, selectedId, controlledExpandedIds, defaultExpandAll);

  const handleSelect = React.useCallback(
    (node: TreeNode) => {
      if (!selectedId) {
        setInternalSelectedId(node.id);
      }
      onSelect?.(node);
    },
    [selectedId, setInternalSelectedId, onSelect]
  );

  const handleToggle = React.useCallback(
    (nodeId: string, expanded: boolean) => {
      if (!isControlled) {
        setInternalExpandedIds(prev => {
          const newExpandedIds = new Set(prev);
          if (expanded) {
            newExpandedIds.add(nodeId);
          } else {
            newExpandedIds.delete(nodeId);
          }
          return newExpandedIds;
        });
      }
      onToggle?.(nodeId, expanded);
    },
    [isControlled, setInternalExpandedIds, onToggle]
  );

  return (
    <div className={cn('space-y-0.5', className)}>
      <TreeNodeList
        data={data}
        expandedIds={expandedIds}
        currentSelectedId={currentSelectedId}
        showIcons={showIcons}
        onSelect={handleSelect}
        onToggle={handleToggle}
      />
    </div>
  );
}

function getAllNodeIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];

  function traverse(nodeList: TreeNode[]) {
    for (const node of nodeList) {
      ids.push(node.id);
      if (node.children) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return ids;
}
