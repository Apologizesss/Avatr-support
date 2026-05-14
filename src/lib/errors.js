// Translates Supabase/PostgreSQL errors into friendly Thai messages.
//
// Supabase errors often come with a `code` (Postgres SQLSTATE) + `message`.
// We match against known patterns first, then fall back to the raw message.

export function translateError(err) {
  if (!err) return 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'
  const msg = typeof err === 'string' ? err : err.message || String(err)
  const code = err.code || ''
  const lower = msg.toLowerCase()

  // ---------- PostgreSQL error codes ----------
  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  const codeMap = {
    '23505': 'ข้อมูลนี้มีอยู่แล้ว (ซ้ำกับรายการอื่น)',
    '23502': 'มีช่องที่จำเป็นต้องกรอกแต่ถูกเว้นว่าง',
    '23503': 'ไม่สามารถลบได้ เพราะมีข้อมูลอื่นอ้างอิงอยู่',
    '23514': 'ข้อมูลไม่ผ่านเงื่อนไขที่กำหนด',
    '42P01': 'ไม่พบตารางในฐานข้อมูล',
    '42703': 'ไม่พบคอลัมน์ที่ระบุในตาราง',
    '42501': 'ไม่มีสิทธิ์ทำรายการนี้ (กรุณาติดต่อผู้ดูแลระบบ)',
    '22P02': 'รูปแบบข้อมูลไม่ถูกต้อง',
    '22001': 'ข้อมูลยาวเกินกว่าที่ระบบรองรับ',
    '22003': 'ตัวเลขเกินขอบเขตที่กำหนด',
    '22007': 'รูปแบบวันที่/เวลาไม่ถูกต้อง',
    '22008': 'ค่าวันที่/เวลาเกินขอบเขต',
    PGRST116: 'ไม่พบข้อมูลที่ค้นหา',
    PGRST301: 'ไม่มีสิทธิ์เข้าถึง (RLS block)',
  }
  if (codeMap[code]) return codeMap[code]

  // ---------- Auth errors ----------
  if (/invalid login credentials/i.test(msg))
    return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
  if (/email not confirmed/i.test(msg))
    return 'อีเมลยังไม่ได้รับการยืนยัน กรุณาตรวจสอบ inbox'
  if (/user not found/i.test(msg)) return 'ไม่พบผู้ใช้ในระบบ'
  if (/weak password|password.*short/i.test(msg))
    return 'รหัสผ่านสั้นเกินไป (ต้องมีอย่างน้อย 6 ตัวอักษร)'
  if (/rate limit/i.test(msg))
    return 'พยายามบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'

  // ---------- Network / connection ----------
  if (/failed to fetch|network|cors/i.test(msg))
    return 'เชื่อมต่อ server ไม่ได้ กรุณาเช็คอินเทอร์เน็ต'
  if (/invalid api key/i.test(msg))
    return 'API Key ไม่ถูกต้อง กรุณาตั้งค่าใหม่'
  if (/jwt expired|token.*expired/i.test(msg))
    return 'เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง'

  // ---------- Postgres messages by content ----------
  if (/does not exist/i.test(msg)) {
    if (/column/i.test(msg)) {
      const match = msg.match(/column[s]?\s+"?([\w.]+)"?/i)
      return match ? `ไม่พบคอลัมน์ "${match[1]}" ในตาราง` : 'ไม่พบคอลัมน์ที่ระบุ'
    }
    if (/relation|table/i.test(msg)) {
      return 'ไม่พบตารางในฐานข้อมูล'
    }
  }
  if (/duplicate key/i.test(msg)) return 'ข้อมูลนี้มีอยู่แล้ว (ซ้ำกับรายการอื่น)'
  if (/violates not-null/i.test(msg)) {
    const match = msg.match(/column "([^"]+)"/)
    return match
      ? `กรุณากรอกข้อมูลในช่อง "${match[1]}"`
      : 'มีช่องที่จำเป็นต้องกรอกแต่ถูกเว้นว่าง'
  }
  if (/violates foreign key/i.test(msg))
    return 'ข้อมูลอ้างอิงไม่ถูกต้อง (กรุณาตรวจสอบ)'
  if (/violates check constraint/i.test(msg))
    return 'ข้อมูลไม่ผ่านเงื่อนไขที่กำหนด'
  if (/permission denied|new row violates row-level security/i.test(msg))
    return 'ไม่มีสิทธิ์ทำรายการนี้ (RLS)'
  if (/invalid input syntax/i.test(msg)) return 'รูปแบบข้อมูลไม่ถูกต้อง'
  if (/out of range/i.test(msg)) return 'ค่าที่กรอกเกินขอบเขตที่กำหนด'

  // ---------- Fallback ----------
  // If it's a technical message, wrap it so users know this is raw info
  if (lower.includes('error') || lower.includes('exception')) {
    return `เกิดข้อผิดพลาด: ${msg}`
  }
  return msg
}

/**
 * Ensure any thrown value (string, Error, Supabase error object) becomes
 * a friendly Thai message for display.
 */
export function friendlyError(err) {
  return translateError(err)
}
