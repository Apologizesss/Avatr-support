import { useEffect, useMemo, useState } from 'react'
import {
  MessageSquare,
  Search,
  RefreshCw,
  User,
  Bot,
  Settings,
  ChevronLeft,
  Table as TableIcon,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react'
import { getClient } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { formatCell } from '../lib/utils'
import { DataTable } from '../components/DataTable'
import { CenteredSpinner, Spinner } from '../components/Spinner'

const CHANNEL_LIMIT = 500
const MESSAGE_LIMIT = 500

/**
 * ChatView: customView replacement for the interaction_log table.
 * - Left rail: channel list (one row per distinct line_user_id) with last
 *   message preview + customer name joined from lead_master.
 * - Main pane: chat bubbles for the selected channel.
 * - Admin can toggle back to the raw DataTable view at any time.
 */
export function ChatView({ table }) {
  const [tableMode, setTableMode] = useState(false)

  if (tableMode) {
    return (
      <div className="space-y-3">
        <button
          className="btn btn-secondary !text-xs"
          onClick={() => setTableMode(false)}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          กลับสู่หน้า Chat
        </button>
        <DataTable table={{ ...table, customView: undefined }} />
      </div>
    )
  }

  return <ChatViewInner table={table} onSwitchToTable={() => setTableMode(true)} />
}

function ChatViewInner({ table, onSwitchToTable }) {
  const [channels, setChannels] = useState([])
  const [leadById, setLeadById] = useState({})
  const [loadingChannels, setLoadingChannels] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const loadChannels = async () => {
    setLoadingChannels(true)
    setError(null)
    try {
      const supabase = getClient()
      // Pull recent messages, group client-side. Cheap enough for <500 rows.
      const { data, error: err } = await supabase
        .from('interaction_log')
        .select('*')
        .order('timestamp', { ascending: false, nullsFirst: false })
        .limit(CHANNEL_LIMIT)
      if (err) {
        // Fallback for tables without "timestamp" column
        const retry = await supabase
          .from('interaction_log')
          .select('*')
          .limit(CHANNEL_LIMIT)
        if (retry.error) throw retry.error
        setChannels(groupChannels(retry.data || []))
      } else {
        setChannels(groupChannels(data || []))
      }

      // Join with lead_master by line_user_id
      const ids = [...new Set((data || []).map((r) => r.line_user_id).filter(Boolean))]
      if (ids.length > 0) {
        const { data: leads } = await supabase
          .from('lead_master')
          .select('line_user_id, customer_name, display_name, lead_score, status, stage')
          .in('line_user_id', ids)
        const map = {}
        for (const l of leads || []) {
          if (l.line_user_id) map[l.line_user_id] = l
        }
        setLeadById(map)
      }
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setLoadingChannels(false)
    }
  }

  useEffect(() => {
    loadChannels()
  }, [])

  // Load messages for the active channel
  useEffect(() => {
    if (!activeId) {
      setMessages([])
      return
    }
    let cancelled = false
    setLoadingMessages(true)
    ;(async () => {
      try {
        const supabase = getClient()
        const { data, error: err } = await supabase
          .from('interaction_log')
          .select('*')
          .eq('line_user_id', activeId)
          .order('timestamp', { ascending: true, nullsFirst: true })
          .limit(MESSAGE_LIMIT)
        if (cancelled) return
        if (err) {
          // Retry without order if column missing
          const retry = await supabase
            .from('interaction_log')
            .select('*')
            .eq('line_user_id', activeId)
            .limit(MESSAGE_LIMIT)
          if (retry.error) throw retry.error
          setMessages(retry.data || [])
        } else {
          setMessages(data || [])
        }
      } catch (e) {
        if (!cancelled) setError(friendlyError(e))
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeId])

  const filteredChannels = useMemo(() => {
    if (!search.trim()) return channels
    const q = search.toLowerCase()
    return channels.filter((c) => {
      const lead = leadById[c.id]
      const hay = [
        c.id,
        c.preview,
        lead?.customer_name,
        lead?.display_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [channels, search, leadById])

  const activeChannel = channels.find((c) => c.id === activeId)
  const activeLead = activeId ? leadById[activeId] : null

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{table.label}</h1>
          <p className="text-sm text-brand-500 dark:text-brand-400 mt-0.5">
            แยกตาม LINE channel — {channels.length} ลูกค้า
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={loadChannels}
            disabled={loadingChannels}
            title="รีเฟรช"
          >
            <RefreshCw className={`w-4 h-4 ${loadingChannels ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">รีเฟรช</span>
          </button>
          <button
            className="btn btn-ghost !text-xs"
            onClick={onSwitchToTable}
            title="ดูแบบ table (advanced)"
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline">ดูแบบ table</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="card p-4 flex items-start gap-3 text-sm border-red-300 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-300">โหลดข้อมูลไม่ได้</p>
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[60vh]">
          {/* Channel list */}
          <aside
            className={`${
              activeId ? 'hidden lg:flex' : 'flex'
            } flex-col border-r border-brand-200 dark:border-brand-800`}
          >
            <div className="p-3 border-b border-brand-200 dark:border-brand-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  className="input pl-9 !text-sm"
                  placeholder="ค้นหาชื่อลูกค้า / ข้อความ"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingChannels ? (
                <CenteredSpinner label="กำลังโหลด channels..." />
              ) : filteredChannels.length === 0 ? (
                <div className="p-8 text-center text-sm text-brand-500">
                  ไม่พบ channel
                </div>
              ) : (
                filteredChannels.map((c) => {
                  const lead = leadById[c.id]
                  const isActive = c.id === activeId
                  const displayName =
                    lead?.customer_name ||
                    lead?.display_name ||
                    (c.id === '__ungrouped__' ? '— ไม่ระบุ user —' : shortenId(c.id))
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left px-3 py-2.5 border-b border-brand-100 dark:border-brand-800/50 transition-colors ${
                        isActive
                          ? 'bg-brand-100 dark:bg-brand-800'
                          : 'hover:bg-brand-50 dark:hover:bg-brand-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-medium text-sm text-brand-900 dark:text-brand-100 truncate">
                          {displayName}
                        </span>
                        {lead?.lead_score != null && (
                          <span className="badge bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 !text-[10px] !py-0 !px-1.5 flex-shrink-0">
                            {lead.lead_score}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-brand-500 dark:text-brand-400 truncate">
                        {c.preview || '—'}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-brand-400 truncate">
                          {c.id !== '__ungrouped__' ? shortenId(c.id) : ''}
                        </span>
                        <span className="text-[10px] text-brand-400">
                          {c.lastAt ? formatCell(c.lastAt, 'timestamp') : ''}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          {/* Message panel */}
          <main
            className={`${
              activeId ? 'flex' : 'hidden lg:flex'
            } flex-col bg-brand-50/40 dark:bg-brand-950/40`}
          >
            {!activeId ? (
              <div className="flex-1 flex items-center justify-center text-brand-500 text-sm p-8 text-center">
                <div>
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-brand-300 dark:text-brand-600" />
                  <p className="font-medium text-brand-700 dark:text-brand-300 mb-1">เลือกลูกค้าเพื่อดูการสนทนา</p>
                  <p className="text-xs text-brand-400 dark:text-brand-500">คลิกชื่อลูกค้าในรายการทางซ้าย</p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation header */}
                <div className="px-4 py-3 border-b border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-900 flex items-center gap-2">
                  <button
                    className="lg:hidden btn btn-ghost !p-1.5"
                    onClick={() => setActiveId(null)}
                    title="กลับ"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {activeLead?.customer_name ||
                        activeLead?.display_name ||
                        (activeId === '__ungrouped__'
                          ? '— ไม่ระบุ user —'
                          : shortenId(activeId))}
                    </div>
                    <div className="text-[11px] text-brand-500 flex items-center gap-2 truncate">
                      {activeId !== '__ungrouped__' && (
                        <code className="font-mono">{shortenId(activeId)}</code>
                      )}
                      {activeLead?.status && (
                        <span className="badge bg-brand-100 dark:bg-brand-800 !text-[10px] !py-0">
                          {activeLead.status}
                        </span>
                      )}
                      {activeLead?.stage && (
                        <span className="badge bg-brand-100 dark:bg-brand-800 !text-[10px] !py-0">
                          {activeLead.stage}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-brand-500">{messages.length} ข้อความ</span>
                </div>

                {/* Bubbles */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loadingMessages ? (
                    <CenteredSpinner label="กำลังโหลดข้อความ..." />
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-brand-500 py-8">
                      ไม่มีข้อความในช่องนี้
                    </div>
                  ) : (
                    messages.map((m) => <Bubble key={m.id} msg={m} />)
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function Bubble({ msg }) {
  const text = msg.message || msg.content || ''
  const role = String(msg.role || msg.sender || '').toLowerCase()
  const isUser = role === 'user' || role === 'customer' || role === 'ลูกค้า'
  const isSystem = role === 'system' || role === 'event'
  const Icon = isUser ? User : isSystem ? Settings : Bot
  const time = msg.timestamp ? formatCell(msg.timestamp, 'timestamp') : ''

  if (isSystem) {
    return (
      <div className="flex justify-center my-1">
        <div className="text-[11px] text-brand-500 dark:text-brand-400 italic px-3 py-1 rounded-full bg-brand-100/70 dark:bg-brand-800/40 inline-flex items-center gap-1">
          <Icon className="w-3 h-3" />
          {text || msg.event_type || 'event'}
          {time && <span className="text-brand-400">· {time}</span>}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex items-start gap-2 max-w-[78%] ${
          isUser ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-brand-900 dark:bg-brand-100 text-white dark:text-brand-950'
              : 'bg-brand-200 dark:bg-brand-700 text-brand-700 dark:text-brand-200'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div>
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
              isUser
                ? 'bg-brand-900 dark:bg-brand-100 text-white dark:text-brand-950 rounded-tr-sm'
                : 'bg-white dark:bg-brand-900 text-brand-900 dark:text-brand-100 border border-brand-200 dark:border-brand-700 rounded-tl-sm'
            }`}
          >
            {text || <span className="italic text-brand-400">(empty)</span>}
          </div>
          {time && (
            <div
              className={`text-[10px] text-brand-400 dark:text-brand-500 mt-0.5 ${
                isUser ? 'text-right' : 'text-left'
              }`}
            >
              {time}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function groupChannels(rows) {
  const map = new Map()
  for (const r of rows) {
    const id = r.line_user_id || '__ungrouped__'
    const existing = map.get(id)
    const text = r.message || r.content || ''
    const ts = r.timestamp ? new Date(r.timestamp).getTime() : 0
    if (!existing) {
      map.set(id, { id, preview: text, lastAt: r.timestamp, _lastTs: ts, count: 1 })
    } else {
      existing.count += 1
      if (ts > existing._lastTs) {
        existing._lastTs = ts
        existing.lastAt = r.timestamp
        existing.preview = text
      }
    }
  }
  const out = [...map.values()].sort((a, b) => (b._lastTs || 0) - (a._lastTs || 0))
  return out
}

function shortenId(id) {
  if (!id || typeof id !== 'string') return ''
  if (id.length <= 14) return id
  return id.slice(0, 6) + '…' + id.slice(-4)
}
