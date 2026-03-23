import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table'
import { fetchLogicNodes, deleteLogicNode } from '@/api/logicNodes.api'
import type { LogicNode } from '@/types/logic-node.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Pencil, Trash2, FileText } from 'lucide-react'

interface LogicListPageProps {
  onEdit?: (node: LogicNode) => void
}

export function LogicListPage({ onEdit }: LogicListPageProps) {
  const { moduleId } = useParams<{ moduleId: string }>()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['logicNodes', moduleId],
    queryFn: () => fetchLogicNodes(moduleId!)
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLogicNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logicNodes', moduleId] })
      toast.success('删除成功')
    },
    onError: (error) => {
      toast.error(error.message || '删除失败')
    }
  })

  function handleDelete(nodeId: string) {
    if (confirm('确定要删除此节点吗？')) {
      deleteMutation.mutate(nodeId)
    }
  }

  function handleEdit(node: LogicNode) {
    if (onEdit) {
      onEdit(node)
    }
  }

  const filteredNodes = nodes.filter((node) =>
    node.name.toLowerCase().includes(search.toLowerCase())
  )

  const columns: ColumnDef<LogicNode>[] = [
    {
      accessorKey: 'name',
      header: '节点名称'
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ getValue }) => {
        const status = getValue() as LogicNode['status']
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
          DRAFT: { label: '草稿', variant: 'secondary' },
          REVIEW: { label: '待评审', variant: 'outline' },
          APPROVED: { label: '已确认', variant: 'default' },
          DEPRECATED: { label: '已废弃', variant: 'destructive' }
        }
        const config = statusMap[status] || { label: status, variant: 'secondary' }
        return <Badge variant={config.variant}>{config.label}</Badge>
      }
    },
    {
      accessorKey: 'priority',
      header: '优先级',
      cell: ({ getValue }) => {
        const priority = getValue() as LogicNode['priority']
        const priorityMap: Record<string, string> = {
          HIGH: '高',
          NORMAL: '中',
          LOW: '低'
        }
        return <span>{priorityMap[priority] || priority}</span>
      }
    },
    {
      accessorKey: 'branches',
      header: '分支数',
      cell: ({ getValue }) => (getValue() as any[])?.length || 0
    },
    {
      accessorKey: 'edgeCases',
      header: '边界条件',
      cell: ({ getValue }) => {
        const edgeCases = getValue() as any[]
        const criticalCount = edgeCases?.filter((e) => e.severity === 'critical').length || 0
        return (
          <div className="flex gap-1">
            <span>{edgeCases?.length || 0}</span>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="h-5 text-xs">{criticalCount}</Badge>
            )}
          </div>
        )
      }
    },
    {
      accessorKey: 'updatedAt',
      header: '最后更新',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString('zh-CN')
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: filteredNodes,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">逻辑节点管理</h1>
          <Button onClick={() => onEdit && onEdit({} as LogicNode)}>
            创建节点
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="搜索节点名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="h-12 px-4 text-left align-middle font-medium text-gray-500"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {table.getRowModel().rows.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>暂无节点数据</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
