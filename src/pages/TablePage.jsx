import { useParams, Navigate } from 'react-router-dom'
import { DataTable } from '../components/DataTable'
import { ChatView } from './ChatView'
import { FaqHub } from './FaqHub'
import { TABLE_BY_ID, TABLES } from '../lib/tables'

export function TablePage() {
  const { tableId } = useParams()
  const table = TABLE_BY_ID[tableId]

  if (!table) {
    return <Navigate to={`/t/${TABLES[0].id}`} replace />
  }

  if (table.customView === 'chat-view') return <ChatView table={table} />
  if (table.customView === 'faq-tabs') return <FaqHub table={table} />

  return <DataTable table={table} />
}
