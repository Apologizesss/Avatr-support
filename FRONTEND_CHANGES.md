# AVATR Admin — Frontend Changes

> สรุปงาน Frontend ทั้งหมดที่ทำในรอบนี้ (UX/UI & User Journey Redesign)
> ส่วน Backend / Database ให้ทีม IT ดำเนินการต่อแยกต่างหาก

---

## ภาพรวม

ก่อนหน้านี้ระบบใช้ pattern เดียวคือ **generic CRUD table** สำหรับทุก table  
หลังจากนี้ระบบจะมี:

| สิ่งที่เพิ่ม | รายละเอียด |
|---|---|
| Image Gallery Field | อัปโหลด URL รูปภาพสูงสุด 5 ภาพต่อ record |
| Group-by Mode | DataTable จัดกลุ่มแถวตาม column ที่กำหนด (เช่น รุ่นรถ) |
| Chat View | หน้าดูประวัติแชทแบบ chat app แยก channel ตาม LINE user |
| FAQ Hub | หน้า FAQ มี 4 tab แยกตามขอบเขต |
| Dashboard ใหม่ | KPI cards + shortcuts ที่ action-oriented |
| Sidebar ใหม่ | จัดกลุ่ม 4 หมวด + submenu collapsible |

---

## ไฟล์ที่สร้างใหม่

### `src/components/ImageGalleryField.jsx`

Component สำหรับ field type `image_gallery` ใน RowEditor และ DataTable

**Exports:**

| Export | ประเภท | หน้าที่ |
|---|---|---|
| `ImageGalleryField` | Component | Editor 5-slot สำหรับกรอก URL รูปภาพ |
| `ImageGalleryCell` | Component | แสดง thumbnail strip ใน DataTable cell (max 3 รูป + badge "+N") |
| `parseImageGalleryValue(v)` | Function | Normalize string / array / JSON → clean URL array |
| `serializeImageGalleryValue(arr)` | Function | แปลง URL array → JSON string สำหรับเก็บใน DB |
| `MAX_IMAGES` | Constant | `5` |

**วิธีทำงาน:**
- Editor แสดง 5 ช่อง (slot) เสมอ แต่ละช่องมี thumbnail preview + URL input + ปุ่มลบ
- Validate URL format (`http://` หรือ `https://` เท่านั้น)
- ถ้า URL โหลดรูปไม่ได้ → แสดงข้อความ "โหลดไม่ได้" แทน
- เก็บค่าใน form state เป็น JSON string เช่น `'["url1","url2"]'`

---

### `src/pages/ChatView.jsx`

Custom view สำหรับ `interaction_log` — แสดงแบบ chat app แทน table

**Layout:**
```
┌─────────────────────┬────────────────────────────────┐
│ Channel list        │  ลูกค้า: คุณสมชาย               │
│ ─────────────────── │  ──────────────────────────────│
│ 🔍 ค้นหา            │                                │
│                     │   ┌──────────────────────┐     │
│ คุณสมชาย            │   │ AI: สวัสดีค่ะ        │     │
│ ข้อความล่าสุด...    │   └──────────────────────┘     │
│                     │                 ┌────────────┐ │
│ คุณสมหญิง           │                 │ ลูกค้า: .. │ │
│ ...                 │                 └────────────┘ │
└─────────────────────┴────────────────────────────────┘
```

**คุณสมบัติ:**
- Channel list ด้านซ้าย: group ตาม `line_user_id`, เรียงตาม timestamp ล่าสุด
- Join กับ `lead_master` เพื่อแสดงชื่อลูกค้า + lead_score + status
- Message bubbles: ลูกค้า (user/customer) → ขวา, AI/bot → ซ้าย, system → กลาง italic
- ค้นหาชื่อลูกค้า / ข้อความในช่องค้นหา
- Mobile: channel list ซ่อนเมื่อเลือก channel แล้ว, มีปุ่ม back
- ปุ่ม "ดูแบบ table" → toggle ไป DataTable ปกติ (admin mode)
- ปุ่ม "รีเฟรช" สำหรับดึงข้อมูลใหม่

**Columns ที่ใช้จาก `interaction_log`:**

| Column | ใช้ทำอะไร |
|---|---|
| `line_user_id` | group เป็น channel |
| `message` หรือ `content` | เนื้อหาข้อความ |
| `role` หรือ `sender` | ตัดสิน bubble ซ้าย/ขวา (`user`/`customer` → ขวา, อื่นๆ → ซ้าย) |
| `timestamp` | เรียงลำดับ + แสดงเวลา |

> **หมายเหตุ:** ถ้า column `timestamp` หรือ `line_user_id` ยังไม่มีใน DB — ChatView จะ fallback ให้อัตโนมัติ ไม่ crash

---

### `src/pages/FaqHub.jsx`

Custom view สำหรับ `faq` — 4 tab แยกตาม scope

**Tabs:**
- ทั่วไป (`general`)
- AVATR 07 (`avatr_07`)
- AVATR 11 (`avatr_11`)
- AVATR 11 Royal (`avatr_11_royal`)

**คุณสมบัติ:**
- แต่ละ tab แสดง count badge (โหลดจาก Supabase แบบ HEAD query)
- คลิก tab → DataTable filter ตาม `scope` อัตโนมัติ
- กดสร้าง record ใหม่ในแต่ละ tab → `scope` จะ pre-fill ให้อัตโนมัติ

> **ข้อกำหนด DB:** ต้องมี column `scope TEXT` ใน table `faq`  
> ค่าที่รองรับ: `general`, `avatr_07`, `avatr_11`, `avatr_11_royal`

---

## ไฟล์ที่แก้ไข

### `src/lib/tables.js`

Config หลักของระบบ — แก้ไขมากที่สุด

**การเปลี่ยนแปลง:**

#### 1. Groups ใหม่ (4 กลุ่ม แทน 5 กลุ่มเดิม)

| กลุ่มใหม่ | ครอบคลุม |
|---|---|
| รถ AVATR | spec tables ทั้งหมด + submenu เปรียบเทียบ |
| ราคา & โปรโมชั่น | promotion, installment, financial lease, ธนาคาร, ประกัน |
| ลูกค้า & แชท | lead_master, interaction_log, pending messages |
| ระบบ | FAQ, lead scoring |

```js
// exports ใหม่ที่เพิ่มใน tables.js
export const GROUP_ORDER = ['รถ AVATR', 'ราคา & โปรโมชั่น', 'ลูกค้า & แชท', 'ระบบ']
export const GROUP_ICONS = {
  'รถ AVATR':           'Car',
  'ราคา & โปรโมชั่น':  'Tag',
  'ลูกค้า & แชท':      'Users',
  'ระบบ':              'Settings',
}
```

#### 2. SubGroup สำหรับ sidebar collapsible

```js
// avatr_comparison และ avatr_11_sr_vs_lr จะซ่อนอยู่ใต้ submenu
{ id: 'avatr_comparison',  subGroup: 'เปรียบเทียบ', group: 'รถ AVATR', ... }
{ id: 'avatr_11_sr_vs_lr', subGroup: 'เปรียบเทียบ', group: 'รถ AVATR', ... }
```

#### 3. Custom Views

```js
// interaction_log → ChatView
{ id: 'interaction_log', customView: 'chat-view', ... }

// faq → FaqHub
{ id: 'faq', customView: 'faq-tabs', ... }
```

#### 4. Group-by mode (รอ DB migration)

```js
// promotion_pricing และ installment_plans จะ group แถวตามรุ่นรถ
{ id: 'promotion_pricing', groupByField: 'applies_to_model', groupByLabel: 'รุ่นรถ', ... }
{ id: 'installment_plans', groupByField: 'applies_to_model', groupByLabel: 'รุ่นรถ', ... }
```

#### 5. Fields ใหม่ใน config (รอ DB migration)

| Table | Field ใหม่ | Type | หมายเหตุ |
|---|---|---|---|
| `avatr_07_spec` | `images` | `image_gallery` | แทน `image_url` เดิม (ยังคงอยู่แต่ซ่อน) |
| `avatr_11_spec` | `images` | `image_gallery` | เช่นเดียวกัน |
| `avatr_11_royal_spec` | `images` | `image_gallery` | เช่นเดียวกัน |
| `promotion_pricing` | `applies_to_model` | enum | AVATR 07/11/11 Royal/ทั้งหมด |
| `promotion_pricing` | `applies_to_color` | text | สีของรถ |
| `promotion_pricing` | `images` | `image_gallery` | รูปโปรโมชั่น |
| `installment_plans` | `applies_to_model` | enum | เช่นเดียวกับ promotion |
| `installment_plans` | `applies_to_color` | text | สีของรถ |
| `faq` | `scope` | enum | general/avatr_07/avatr_11/avatr_11_royal |
| `interaction_log` | `line_user_id` | text | ใช้โดย ChatView |

#### 6. Financial Lease — จัด fieldGroups ใหม่

| กลุ่มเดิม | กลุ่มใหม่ |
|---|---|
| basic | partner (ผู้ให้บริการ) |
| terms | rate (อัตราดอกเบี้ย & ระยะเวลา) |
| amounts | amounts (จำนวนเงิน) |
| detail | detail (รายละเอียดเพิ่มเติม) |
| — | status (สถานะ) |

#### 7. Labels ใหม่ใน COMMON_COLUMN_LABELS

```js
images: 'รูปภาพ',
applies_to_model: 'ใช้ได้กับรุ่น',
applies_to_color: 'สีของรถ',
scope: 'ขอบเขต',
```

---

### `src/components/DataTable.jsx`

**Props ใหม่:**

```tsx
function DataTable({
  table,
  initialFilters,      // Filter[] — pre-set filters (ใช้โดย FaqHub)
  defaultCreateValues, // Record<string, any> — ค่าเริ่มต้นสำหรับ new row (ใช้โดย FaqHub)
})
```

**การเปลี่ยนแปลงหลัก:**

1. **Group-by mode** — เมื่อ `table.groupByField` มีค่า DataTable จะ render เป็น collapsible sections แทน flat rows:
   - Header row แสดง label กลุ่ม + badge จำนวน
   - collapse/expand state เก็บใน `localStorage` (key: `avatr.groupCollapse.{tableId}`)
   - ถ้า `groupByField` ไม่มีค่า → render เหมือนเดิม 100% (zero regression)

2. **`CellValue` รู้จัก `image_gallery`** → render `<ImageGalleryCell>` (thumbnail strip)

3. **`initialFilters` reset** — เมื่อ `table.id` เปลี่ยน filters จะ reset กลับเป็น `initialFilters` ไม่ใช่ `[]`

4. **`defaultCreateValues`** — ส่งต่อไปยัง RowEditor เป็นค่าเริ่มต้นของ new row

---

### `src/components/RowEditor.jsx`

**การเปลี่ยนแปลงหลัก:**

1. **FieldInput รู้จัก `image_gallery`** — dispatch ไปยัง `<ImageGalleryField>` แทน input ปกติ

2. **Initial value** — field type `image_gallery` default เป็น `'[]'` (JSON string ว่าง)

3. **handleSubmit** — validation ข้าม JSON parsing สำหรับ `image_gallery` (เพราะ serialize เป็น JSON string อยู่แล้ว)

4. **parseInputValue** — ใช้ effective type จาก `getColumnMeta(table, col.key)?.type` แทน `col.type` เดิม เพื่อให้ config override ได้

---

### `src/lib/utils.js`

**`parseInputValue(raw, type)`** — เพิ่ม branch สำหรับ `image_gallery`:
- Input เป็น JSON string → parse เป็น array
- Input เป็น array → filter URL ที่ว่างออก
- Input ว่าง → return `[]` (ไม่ใช่ `null`)

---

### `src/components/Layout.jsx`

**Sidebar ใหม่:**

1. **Dashboard link** — ปุ่ม "ภาพรวม" (Home icon) อยู่บนสุดของ nav

2. **Group icons** — หัวกลุ่มมี icon จาก `GROUP_ICONS`

3. **SubGroup collapsible** — กลุ่มที่มี `subGroup` จะแสดงเป็น submenu:
   - ปุ่ม toggle พร้อม ChevronRight icon + badge จำนวน
   - indent ด้านซ้าย + border ซ้าย
   - Auto-expand เมื่อ route ปัจจุบันอยู่ใน subGroup นั้น

---

### `src/pages/Dashboard.jsx`

**จาก:** grid ของ table count cards 15 ใบ  
**เป็น:** action-oriented dashboard

**ส่วนที่เพิ่ม:**

1. **KPI Cards (4 ใบ):**

   | Card | Query |
   |---|---|
   | Lead ใหม่วันนี้ | `lead_master` WHERE `created_at >= today` |
   | ลูกค้ากำลังคุย (24 ชม.) | `interaction_log` distinct `line_user_id` ใน 24 ชม.ล่าสุด |
   | โปรใกล้หมดอายุ (7 วัน) | `promotion_pricing` WHERE `valid_until` ระหว่างวันนี้–7 วันข้างหน้า |
   | FAQ ที่เปิดแสดง | `faq` WHERE `is_active = true` |

2. **ทางลัด (Shortcuts):** ปุ่ม 4 ปุ่มไปยัง table ที่ใช้บ่อย

3. **ข้อมูลทั้งหมด:** compact list 1 บรรทัดต่อ table พร้อม description + count + arrow link

---

### `src/pages/TablePage.jsx`

เพิ่ม dispatch ตาม `table.customView`:

```jsx
if (table.customView === 'chat-view') return <ChatView table={table} />
if (table.customView === 'faq-tabs') return <FaqHub table={table} />
return <DataTable table={table} />
```

---

## สิ่งที่ต้องทำต่อ (Backend / Database)

> ส่วนนี้ให้ทีม IT ดำเนินการ — Frontend รองรับไว้แล้ว

ไฟล์ migration อยู่ที่: **`migrations/01_uxui_grouping.sql`**

Column ที่ต้องเพิ่ม:

| Table | Column ใหม่ | Type | Default |
|---|---|---|---|
| `avatr_07_spec` | `images` | `JSONB` | `'[]'` |
| `avatr_11_spec` | `images` | `JSONB` | `'[]'` |
| `avatr_11_royal_spec` | `images` | `JSONB` | `'[]'` |
| `promotion_pricing` | `applies_to_model` | `TEXT` | — |
| `promotion_pricing` | `applies_to_color` | `TEXT` | — |
| `promotion_pricing` | `images` | `JSONB` | `'[]'` |
| `installment_plans` | `applies_to_model` | `TEXT` | — |
| `installment_plans` | `applies_to_color` | `TEXT` | — |
| `faq` | `scope` | `TEXT` | `'general'` |
| `interaction_log` | `line_user_id` | `TEXT` | — |

> Migration เป็น idempotent (`IF NOT EXISTS`) — รันซ้ำได้อย่างปลอดภัย

---

## วิธีทดสอบ (Frontend)

```bash
cd avatr-admin
npm install
npm run dev
```

**Checklist smoke test:**

- [ ] Dashboard — KPI cards แสดง count (หรือ `—` ถ้า DB ยังไม่มี column)
- [ ] Sidebar — 4 กลุ่ม, กด "เปรียบเทียบ" expand/collapse ได้
- [ ] Spec table (AVATR 11) → กด edit row → เห็น 5-slot image gallery
- [ ] FAQ → เห็น 4 tab พร้อม count badge
- [ ] Interaction log → เห็น channel list ซ้าย + bubble ขวา
- [ ] Interaction log → ปุ่ม "ดูแบบ table" toggle ได้
- [ ] Table ที่ไม่ได้แก้ (เช่น `financial_partners`) → render เหมือนเดิม
- [ ] Dark mode — ทุก widget รองรับ
- [ ] Mobile (width < 768px) — sidebar เป็น drawer, chat view stack แนวตั้ง

**Build check:**

```bash
npm run build
# ต้องผ่านโดยไม่มี error (warning chunk size เป็น pre-existing ไม่ใช่ error)
```

---

## ขอบเขตที่ไม่ได้ทำในรอบนี้

- Upload รูปเข้า Supabase Storage (รองรับแค่ URL)
- Real-time sync (ต้องกด refresh เอง)
- Role-based permission เพิ่มเติม
- i18n / ภาษาอื่น
- เพิ่ม table ใหม่ใน DB
