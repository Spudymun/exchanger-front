'use client';

import React, { useState, useCallback } from 'react';

import { TreeNodeItem, type TreeNode } from './tree-view/TreeNodeItem';

export type { TreeNode };

export interface TreeViewProps {
  data: TreeNode[];
  onSelect?: (node: TreeNode) => void;
  selectedId?: string;
  defaultExpanded?: string[];
  showLines?: boolean;
  checkable?: boolean;
  onCheck?: (checkedKeys: string[]) => void;
  className?: string;
  levelPadding?: number;
}

// Хук для управления состоянием развернутых узлов
const useExpandedNodes = (defaultExpanded: string[]) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(defaultExpanded));

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  return { expandedNodes, toggleNode };
};

// Хук для управления состоянием отмеченных узлов
const useCheckedNodes = (onCheck: (checkedKeys: string[]) => void) => {
  const [checkedNodes, setCheckedNodes] = useState<Set<string>>(new Set());

  const handleCheck = useCallback(
    (nodeId: string, checked: boolean) => {
      setCheckedNodes(prev => {
        const newSet = new Set(prev);
        if (checked) {
          newSet.add(nodeId);
        } else {
          newSet.delete(nodeId);
        }
        onCheck(Array.from(newSet));
        return newSet;
      });
    },
    [onCheck]
  );

  return { checkedNodes, handleCheck };
};

// Функция для рендеринга узлов дерева
const renderTreeNodes = (
  nodes: TreeNode[],
  props: {
    selectedId?: string;
    onSelect: (node: TreeNode) => void;
    expandedNodes: Set<string>;
    toggleNode: (nodeId: string) => void;
    levelPadding: number;
    showLines: boolean;
    checkable: boolean;
    checkedNodes: Set<string>;
    handleCheck: (nodeId: string, checked: boolean) => void;
  }
) => {
  return nodes.map(node => (
    <TreeNodeItem
      key={node.id}
      node={node}
      level={0}
      isSelected={node.id === props.selectedId}
      isExpanded={props.expandedNodes.has(node.id)}
      onSelect={props.onSelect}
      onToggle={props.toggleNode}
      expandedNodes={props.expandedNodes}
      levelPadding={props.levelPadding}
      showLines={props.showLines}
      checkable={props.checkable}
      checkedNodes={props.checkedNodes}
      onCheck={props.handleCheck}
    />
  ));
};

export const TreeView: React.FC<TreeViewProps> = ({
  data,
  onSelect = () => {},
  selectedId,
  defaultExpanded = [],
  showLines = false,
  checkable = false,
  onCheck = () => {},
  className = '',
  levelPadding = 16,
}) => {
  const { expandedNodes, toggleNode } = useExpandedNodes(defaultExpanded);
  const { checkedNodes, handleCheck } = useCheckedNodes(onCheck);

  return (
    <div className={`tree-view ${className}`}>
      {renderTreeNodes(data, {
        selectedId,
        onSelect,
        expandedNodes,
        toggleNode,
        levelPadding,
        showLines,
        checkable,
        checkedNodes,
        handleCheck,
      })}
    </div>
  );
};
