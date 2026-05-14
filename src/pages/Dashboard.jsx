import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Users,
  MessageSquare,
  Tag,
  HelpCircle,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { TABLE_GROUPS, TABLES } from '../lib/tables'
import { getClient } from '../lib/supabase'
import { Spinner } from '../components/Spinner'

const SHORTCUTS = [
  { label: 'เพิ่มลูกค้า',     to: '/t/lead_master',       icon: Users },
  { label: 'เพิ่มโปรโมชั่น',  to: '/t/promotion_pricing', icon: Tag },
  { label: 'ดูแชท LINE',     to: '/t/interaction_log',   icon: MessageSquare },
  { label: 'เพิ่ม FAQ',       to: '/t/faq',               icon: HelpCircle },
]

export function Dashboard() {
  const [kpis, setKpis] = useState({
    newLeads: null,
    activeChannels: null,
    expiringPromos: null,
    activeFaqs: null,
  })
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [auditAvailable, setAuditAvailable] = useState(null)

  useEffect(() => {
    let cancelled = false
    const supabase = getClient()

    // KPIs in parallel
    ;(async () => {
      const todayIso = new Date()
      todayIso.setHours(0, 0, 0, 0)
      const todayStr = todayIso.toISOString()

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

      const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const nowIso = new Date().toISOString()

      const [leads, channels, promos, faqs] = await Promise.all([
        // New leads today
        supabase
          .from('lead_master')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStr)
          .then((r) => (r.error ? null : r.count ?? 0)),
        // Active channels last 24h (distinct line_user_id — approximate count via select)
        supabase
          .from('interaction_log')
          .select('line_user_id', { count: 'exact', head: false })
          .gte('timestamp', yesterday)
          .limit(500)
          .then((r) => {
            if (r.error) return null
            const uniq = new Set((r.data || []).map((x) => x.line_user_id).filter(Boolean))
            return uniq.size
          }),
        // Promos expiring within 7 days
        supabase
          .from('promotion_pricing')
          .select('*', { count: 'exact', head: true })
          .gte('valid_until', nowIso)
          .lte('valid_until', inSevenDays)
          .then((r) => (r.error ? null : r.count ?? 0)),
        // Active FAQs
        supabase
          .from('faq')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .then((r) => (r.error ? null : r.count ?? 0)),
      ])

      if (cancelled) return
      setKpis({
        newLeads: leads,
        activeChannels: channels,
        expiringPromos: promos,
        activeFaqs: faqs,
      })
    })()

    // Per-table counts (compact section list)
    Promise.all(
      TABLES.map(async (t) => {
        try {
          const { count, error } = await supabase
            .from(t.id)
            .select('*', { count: 'exact', head: true })
          return [t.id, error ? null : count ?? 0]
        } catch {
          return [t.id, null]
        }
      })
    ).then((results) => {
      if (cancelled) return
      setCounts(Object.fromEntries(results))
      setLoading(false)
    })

    // Audit log
    supabase
      .from('avatr_audit_log')
      .select('*', { count: 'exact', head: true })
      .then(({ error }) => {
        if (cancelled) return
        setAuditAvailable(!error)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ภาพรวมวันนี้</h1>
        <p className="text-brand-500 dark:text-brand-400 text-sm mt-1">
          จัดการข้อมูล AVATR ทั้งหมดจากที่นี่
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Lead ใหม่วันนี้"
          value={kpis.newLeads}
          icon={Users}
          accent="text-brand-700 dark:text-brand-300"
          to="/t/lead_master"
        />
        <KpiCard
          label="ลูกค้ากำลังคุย (24 ชม.)"
          value={kpis.activeChannels}
          icon={MessageSquare}
          accent="text-emerald-700 dark:text-emerald-300"
          to="/t/interaction_log"
        />
        <KpiCard
          label="โปรใกล้หมดอายุ (7 วัน)"
          value={kpis.expiringPromos}
          icon={Tag}
          accent="text-amber-700 dark:text-amber-300"
          to="/t/promotion_pricing"
        />
        <KpiCard
          label="FAQ ที่เปิดแสดง"
          value={kpis.activeFaqs}
          icon={HelpCircle}
          accent="text-sky-700 dark:text-sky-300"
          to="/t/faq"
        />
      </div>

      {/* Shortcuts */}
      <section>
        <h2 className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          ทางลัด
        </h2>
        <div className="flex flex-wrap gap-2">
          {SHORTCUTS.map((s) => {
            const Icon = s.icon
            return (
              <Link
                key={s.to}
                to={s.to}
                className="btn btn-secondary !text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <Icon className="w-3.5 h-3.5" />
                {s.label}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Audit status */}
      <div className="card p-3 flex items-center gap-3 text-sm">
        {auditAvailable === null ? (
          <Spinner className="w-4 h-4 text-brand-400" />
        ) : auditAvailable ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        )}
        <div className="flex-1">
          {auditAvailable === null ? (
            <span className="text-brand-500">กำลังตรวจสอบระบบ...</span>
          ) : auditAvailable ? (
            <span className="text-brand-700 dark:text-brand-300">
              <strong>ระบบ Audit Log ทำงานอยู่</strong> — ทุกการเปลี่ยนแปลงถูกบันทึก
            </span>
          ) : (
            <div className="text-brand-700 dark:text-brand-300">
              <strong>Audit Log ยังไม่ได้เปิดใช้งาน</strong>
              <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
                ทีม IT สามารถเปิดได้ตามคำสั่งใน README
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compact section list */}
      <section>
        <h2 className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-3">
          ข้อมูลทั้งหมด
        </h2>
        <div className="space-y-4">
          {Object.entries(TABLE_GROUPS).map(([group, tables]) => (
            <div key={group}>
              <div className="text-xs font-medium text-brand-500 dark:text-brand-400 mb-1.5 px-1">
                {group}
              </div>
              <div className="card divide-y divide-brand-100 dark:divide-brand-800">
                {tables.map((t) => (
                  <Link
                    key={t.id}
                    to={`/t/${t.id}`}
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-800/40 transition-colors text-sm group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate flex items-center gap-2">
                        {t.label}
                        {t.customView && (
                          <span className="badge bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300 !text-[9px] !py-0">
                            ใหม่
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-brand-500 dark:text-brand-400 truncate">
                        {t.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0">
                      <span className="font-semibold tabular-nums text-brand-700 dark:text-brand-300">
                        {loading ? (
                          <Spinner className="w-3 h-3 inline" />
                        ) : counts[t.id] === null ? (
                          <span className="text-red-500 text-[10px]">—</span>
                        ) : (
                          (counts[t.id] ?? 0).toLocaleString()
                        )}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, accent, to }) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className="text-xs text-brand-500 dark:text-brand-400 leading-snug">
          {label}
        </span>
        <Icon className={`w-4 h-4 flex-shrink-0 ${accent}`} />
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${accent}`}>
        {value === null ? (
          <span className="text-brand-300 dark:text-brand-700">—</span>
        ) : (
          (value ?? 0).toLocaleString()
        )}
      </div>
    </>
  )
  if (to) {
    return (
      <Link
        to={to}
        className="card p-3 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all block"
      >
        {body}
      </Link>
    )
  }
  return <div className="card p-3">{body}</div>
}
