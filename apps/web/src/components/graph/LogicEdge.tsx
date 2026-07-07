import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath
} from '@xyflow/react'
import { ConnectionType } from '@logimap/types'

interface EdgeData {
  connectionType: ConnectionType
  label?: string
}

const connectionTypeConfig: Record<ConnectionType, { label: string; color: string }> = {
  TRIGGERS: { label: '触发', color: 'var(--color-info-icon)' },
  DEPENDS_ON: { label: '依赖', color: 'var(--color-text-brand)' },
  BLOCKS: { label: '阻断', color: 'var(--color-error-icon)' },
  EXTENDS: { label: '扩展', color: 'var(--color-success-icon)' }
}

export const LogicEdge = memo((props: EdgeProps) => {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    data
  } = props

  const edgeData = data as EdgeData | undefined
  const connectionType = edgeData?.connectionType || 'TRIGGERS'
  const config = connectionTypeConfig[connectionType]
  const label = edgeData?.label || config.label
  const highlighted = (data as { highlighted?: boolean } | undefined)?.highlighted === true
  const dimmed = (data as { dimmed?: boolean } | undefined)?.dimmed === true
  const opacity = highlighted ? 1 : dimmed ? 0.2 : 1

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25
  })

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: config.color, opacity }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            background: 'var(--color-bg-elevated)',
            border: `1px solid ${config.color}`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '11px',
            color: config.color,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            opacity
          }}
          className="nodrag nopan"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

LogicEdge.displayName = 'LogicEdge'
