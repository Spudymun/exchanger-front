import React from 'react'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'
import { cn } from '../lib/utils'

export interface TreeNode {
    id: string
    label: string
    children?: TreeNode[]
    icon?: React.ReactNode
    data?: any
    disabled?: boolean
}

export interface TreeViewProps {
    data: TreeNode[]
    onSelect?: (node: TreeNode) => void
    selectedId?: string
    expandedIds?: string[]
    onToggle?: (nodeId: string, expanded: boolean) => void
    className?: string
    showIcons?: boolean
    defaultExpandAll?: boolean
}

interface TreeItemProps {
    node: TreeNode
    level: number
    isExpanded: boolean
    isSelected: boolean
    onSelect?: (node: TreeNode) => void
    onToggle?: (nodeId: string, expanded: boolean) => void
    showIcons?: boolean
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
    const hasChildren = node.children && node.children.length > 0
    const paddingLeft = level * 16

    const handleClick = () => {
        if (!node.disabled) {
            onSelect?.(node)
        }
    }

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (hasChildren) {
            onToggle?.(node.id, !isExpanded)
        }
    }

    return (
        <div>
            <div
                className={cn(
                    'flex items-center py-1 px-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md transition-colors',
                    isSelected && 'bg-accent text-accent-foreground',
                    node.disabled && 'opacity-50 cursor-not-allowed'
                )}
                style={{ paddingLeft }}
                onClick={handleClick}
            >
                {/* Expand/Collapse Button */}
                <div className="w-4 h-4 mr-1 flex items-center justify-center">
                    {hasChildren ? (
                        <button
                            onClick={handleToggle}
                            className="hover:bg-muted rounded p-0.5 transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                            ) : (
                                <ChevronRight className="h-3 w-3" />
                            )}
                        </button>
                    ) : (
                        <div className="w-3 h-3" />
                    )}
                </div>

                {/* Icon */}
                {showIcons && (
                    <div className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground">
                        {node.icon || (hasChildren ? <Folder className="h-3 w-3" /> : <File className="h-3 w-3" />)}
                    </div>
                )}

                {/* Label */}
                <span className="flex-1 truncate">{node.label}</span>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map((child) => (
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
            )}
        </div>
    )
}

interface TreeItemContainerProps {
    node: TreeNode
    level: number
    onSelect?: (node: TreeNode) => void
    onToggle?: (nodeId: string, expanded: boolean) => void
    showIcons?: boolean
}

function TreeItemContainer({ node, level, onSelect, onToggle, showIcons }: TreeItemContainerProps) {
    const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())
    const [selectedId, setSelectedId] = React.useState<string>()

    const handleSelect = (selectedNode: TreeNode) => {
        setSelectedId(selectedNode.id)
        onSelect?.(selectedNode)
    }

    const handleToggle = (nodeId: string, expanded: boolean) => {
        const newExpandedIds = new Set(expandedIds)
        if (expanded) {
            newExpandedIds.add(nodeId)
        } else {
            newExpandedIds.delete(nodeId)
        }
        setExpandedIds(newExpandedIds)
        onToggle?.(nodeId, expanded)
    }

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
    )
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
    const [internalExpandedIds, setInternalExpandedIds] = React.useState<Set<string>>(
        new Set(defaultExpandAll ? getAllNodeIds(data) : [])
    )
    const [internalSelectedId, setInternalSelectedId] = React.useState<string>()

    const isControlled = controlledExpandedIds !== undefined
    const expandedIds = isControlled ? new Set(controlledExpandedIds) : internalExpandedIds
    const currentSelectedId = selectedId ?? internalSelectedId

    const handleSelect = (node: TreeNode) => {
        if (!selectedId) {
            setInternalSelectedId(node.id)
        }
        onSelect?.(node)
    }

    const handleToggle = (nodeId: string, expanded: boolean) => {
        if (!isControlled) {
            const newExpandedIds = new Set(internalExpandedIds)
            if (expanded) {
                newExpandedIds.add(nodeId)
            } else {
                newExpandedIds.delete(nodeId)
            }
            setInternalExpandedIds(newExpandedIds)
        }
        onToggle?.(nodeId, expanded)
    }

    return (
        <div className={cn('space-y-0.5', className)}>
            {data.map((node) => (
                <TreeItem
                    key={node.id}
                    node={node}
                    level={0}
                    isExpanded={expandedIds.has(node.id)}
                    isSelected={currentSelectedId === node.id}
                    onSelect={handleSelect}
                    onToggle={handleToggle}
                    showIcons={showIcons}
                />
            ))}
        </div>
    )
}

function getAllNodeIds(nodes: TreeNode[]): string[] {
    const ids: string[] = []

    function traverse(nodeList: TreeNode[]) {
        for (const node of nodeList) {
            ids.push(node.id)
            if (node.children) {
                traverse(node.children)
            }
        }
    }

    traverse(nodes)
    return ids
}
