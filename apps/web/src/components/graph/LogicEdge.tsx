import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath
} from '@xyflow/react'

const connectionTypeConfig: Record<string, { label: string; color: string }> = {
  TRIGGERS: { label: '触发', color: '#3b82f6' },
  DEPENDS_ON: { label: '依赖', color: '#8b5cf6' },
  BLOCKS: { label: '阻断', color: '#ef4444' },
  EXTENDS: { label: '扩展', color: '#22c55e' }
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

  const connectionType = (data as any)?.connectionType || 'TRIGGERS'
  const config = connectionTypeConfig[connectionType] || connectionTypeConfig.TRIGGERS
  const label = (data as any)?.label || config.label

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
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ strokeWidth: 2, stroke: config.color }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            background: 'white',
            border: `1px solid ${config.color}`,
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '11px',
            color: config.color,
            fontWeight: 500,
            whiteSpace: 'nowrap'
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
