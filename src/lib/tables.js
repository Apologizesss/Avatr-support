// Central config for all Supabase tables managed by this Admin Panel.
//
// Per-table options:
//   - id                  : actual Supabase table name
//   - label               : friendly name (Thai)
//   - group               : sidebar group
//   - icon                : lucide-react icon name
//   - description         : short help text
//   - columnLabels        : { <db_col>: 'ภาษาไทย' } — override labels for this table
//   - primaryDisplayField : column key used as the row's "title" (DataTable + delete preview)
//   - fieldGroups         : ordered list of sections shown in DataTable header / RowEditor
//                           [{ key, label, defaultOpen }]
//   - columnMeta          : per-column metadata (all keys optional)
//                           {
//                             [colKey]: {
//                               description, group, type,
//                               filterable: { kind, ... },
//                               sortable, tableVisibility, formOrder,
//                               enumOptions, unit
//                             }
//                           }
//
// All metadata fields are OPTIONAL. Tables without fieldGroups/columnMeta still
// render correctly via auto-fallback (see helpers below).

export const TABLES = [
  // ---------- Specs ----------
  {
    id: 'avatr_07_spec',
    label: 'AVATR 07',
    group: 'รถ AVATR',
    icon: 'Car',
    description: 'ข้อมูลสเปครถ AVATR 07',
    primaryDisplayField: 'variant',
    fieldGroups: [
      { key: 'basic',       label: 'ข้อมูลพื้นฐาน', defaultOpen: true  },
      { key: 'battery',     label: 'แบตเตอรี่',     defaultOpen: true  },
      { key: 'performance', label: 'สมรรถนะ',       defaultOpen: false },
      { key: 'pricing',     label: 'ราคา',          defaultOpen: false },
      { key: 'design',      label: 'ดีไซน์ / สี',   defaultOpen: false },
    ],
    columnMeta: {
      variant: {
        description: 'ชื่อรุ่นย่อยของ AVATR 07',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      model: {
        description: 'ชื่อรุ่นหลัก',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
      },
      trim: {
        description: 'ระดับการตกแต่ง (Trim)',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 3,
      },
      battery_kwh: {
        description: 'ความจุแบตเตอรี่ (กิโลวัตต์-ชั่วโมง)',
        group: 'battery',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 200, step: 1, unit: 'kWh' },
        sortable: true,
        unit: 'kWh',
        formOrder: 10,
      },
      range_km: {
        description: 'ระยะทางต่อการชาร์จเต็ม',
        group: 'battery',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1000, step: 10, unit: 'กม.' },
        sortable: true,
        unit: 'กม.',
        formOrder: 11,
      },
      horsepower: {
        description: 'กำลังเครื่องยนต์/มอเตอร์',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1500, step: 10, unit: 'hp' },
        sortable: true,
        unit: 'hp',
        formOrder: 20,
      },
      hp: {
        description: 'กำลังเครื่องยนต์/มอเตอร์',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1500, step: 10, unit: 'hp' },
        sortable: true,
        unit: 'hp',
        formOrder: 20,
      },
      torque: {
        description: 'แรงบิดสูงสุด',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 2000, step: 10, unit: 'Nm' },
        sortable: true,
        unit: 'Nm',
        formOrder: 21,
      },
      acceleration: {
        description: 'อัตราเร่ง 0-100 กม./ชม.',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 20, step: 0.1, unit: 'วินาที' },
        sortable: true,
        unit: 'วินาที',
        formOrder: 22,
      },
      top_speed: {
        description: 'ความเร็วสูงสุด',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 400, step: 5, unit: 'กม./ชม.' },
        sortable: true,
        unit: 'กม./ชม.',
        formOrder: 23,
      },
      price: {
        description: 'ราคาขาย (บาท)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 30,
      },
      price_thb: {
        description: 'ราคาขาย (บาท)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 30,
      },
      msrp: {
        description: 'ราคาแนะนำ (MSRP)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 31,
      },
      color: {
        description: 'สีของรถ',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 40,
      },
      color_exterior: {
        description: 'สีภายนอก',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 41,
      },
      color_interior: {
        description: 'สีภายใน',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 42,
      },
      exterior_color: {
        description: 'สีภายนอก',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 41,
      },
      interior_color: {
        description: 'สีภายใน',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 42,
      },
      features: {
        description: 'รายการฟีเจอร์ (JSON)',
        group: 'design',
        type: 'json',
        formOrder: 50,
      },
      images: {
        description: 'รูปภาพรถ (สูงสุด 5 ภาพ) — วาง URL ในแต่ละช่อง',
        group: 'design',
        type: 'image_gallery',
        formOrder: 51,
      },
      image_url: {
        description: 'URL รูปภาพรถ (เดิม — ใช้ฟิลด์ "รูปภาพรถ" แทน)',
        group: 'design',
        type: 'text',
        formOrder: 52,
        tableVisibility: 'hidden',
      },
    },
  },
  {
    id: 'avatr_11_spec',
    label: 'AVATR 11',
    group: 'รถ AVATR',
    icon: 'Car',
    description: 'ข้อมูลสเปครถ AVATR 11 (SR / LR)',
    primaryDisplayField: 'variant',
    fieldGroups: [
      { key: 'basic',       label: 'ข้อมูลพื้นฐาน', defaultOpen: true  },
      { key: 'battery',     label: 'แบตเตอรี่',     defaultOpen: true  },
      { key: 'performance', label: 'สมรรถนะ',       defaultOpen: false },
      { key: 'pricing',     label: 'ราคา',          defaultOpen: false },
      { key: 'design',      label: 'ดีไซน์ / สี',   defaultOpen: false },
    ],
    columnMeta: {
      variant: {
        description: 'รุ่นย่อย เช่น SR หรือ LR',
        group: 'basic',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
        enumOptions: [
          { value: 'SR', label: 'SR (Standard Range)' },
          { value: 'LR', label: 'LR (Long Range)' },
        ],
      },
      model: {
        description: 'ชื่อรุ่นหลัก',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
      },
      trim: {
        description: 'ระดับการตกแต่ง (Trim)',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 3,
      },
      battery_kwh: {
        description: 'ความจุแบตเตอรี่ (กิโลวัตต์-ชั่วโมง)',
        group: 'battery',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 200, step: 1, unit: 'kWh' },
        sortable: true,
        unit: 'kWh',
        formOrder: 10,
      },
      range_km: {
        description: 'ระยะทางต่อการชาร์จเต็ม',
        group: 'battery',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1000, step: 10, unit: 'กม.' },
        sortable: true,
        unit: 'กม.',
        formOrder: 11,
      },
      horsepower: {
        description: 'กำลังมอเตอร์',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1500, step: 10, unit: 'hp' },
        sortable: true,
        unit: 'hp',
        formOrder: 20,
      },
      hp: {
        description: 'กำลังมอเตอร์',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1500, step: 10, unit: 'hp' },
        sortable: true,
        unit: 'hp',
        formOrder: 20,
      },
      torque: {
        description: 'แรงบิดสูงสุด',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 2000, step: 10, unit: 'Nm' },
        sortable: true,
        unit: 'Nm',
        formOrder: 21,
      },
      acceleration: {
        description: 'อัตราเร่ง 0-100 กม./ชม.',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 20, step: 0.1, unit: 'วินาที' },
        sortable: true,
        unit: 'วินาที',
        formOrder: 22,
      },
      top_speed: {
        description: 'ความเร็วสูงสุด',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 400, step: 5, unit: 'กม./ชม.' },
        sortable: true,
        unit: 'กม./ชม.',
        formOrder: 23,
      },
      price: {
        description: 'ราคาขาย (บาท)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 30,
      },
      price_thb: {
        description: 'ราคาขาย (บาท)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 30,
      },
      msrp: {
        description: 'ราคาแนะนำ (MSRP)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 31,
      },
      color: {
        description: 'สีของรถ',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 40,
      },
      color_exterior: {
        description: 'สีภายนอก',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 41,
      },
      color_interior: {
        description: 'สีภายใน',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 42,
      },
      exterior_color: {
        description: 'สีภายนอก',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 41,
      },
      interior_color: {
        description: 'สีภายใน',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 42,
      },
      features: {
        description: 'รายการฟีเจอร์ (JSON)',
        group: 'design',
        type: 'json',
        formOrder: 50,
      },
      images: {
        description: 'รูปภาพรถ (สูงสุด 5 ภาพ) — วาง URL ในแต่ละช่อง',
        group: 'design',
        type: 'image_gallery',
        formOrder: 51,
      },
      image_url: {
        description: 'URL รูปภาพรถ (เดิม — ใช้ฟิลด์ "รูปภาพรถ" แทน)',
        group: 'design',
        type: 'text',
        formOrder: 52,
        tableVisibility: 'hidden',
      },
    },
  },
  {
    id: 'avatr_11_royal_spec',
    label: 'AVATR 11 Royal',
    group: 'รถ AVATR',
    icon: 'Crown',
    description: 'ข้อมูลสเปครถ AVATR 11 Royal Edition',
    primaryDisplayField: 'variant',
    fieldGroups: [
      { key: 'basic',       label: 'ข้อมูลพื้นฐาน', defaultOpen: true  },
      { key: 'battery',     label: 'แบตเตอรี่',     defaultOpen: true  },
      { key: 'performance', label: 'สมรรถนะ',       defaultOpen: false },
      { key: 'pricing',     label: 'ราคา',          defaultOpen: false },
      { key: 'design',      label: 'ดีไซน์ / สี',   defaultOpen: false },
    ],
    columnMeta: {
      variant: {
        description: 'รุ่นย่อย Royal Edition',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      model: {
        description: 'ชื่อรุ่นหลัก',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
      },
      trim: {
        description: 'ระดับการตกแต่ง (Trim)',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 3,
      },
      battery_kwh: {
        description: 'ความจุแบตเตอรี่ (กิโลวัตต์-ชั่วโมง)',
        group: 'battery',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 200, step: 1, unit: 'kWh' },
        sortable: true,
        unit: 'kWh',
        formOrder: 10,
      },
      range_km: {
        description: 'ระยะทางต่อการชาร์จเต็ม',
        group: 'battery',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1000, step: 10, unit: 'กม.' },
        sortable: true,
        unit: 'กม.',
        formOrder: 11,
      },
      horsepower: {
        description: 'กำลังมอเตอร์',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1500, step: 10, unit: 'hp' },
        sortable: true,
        unit: 'hp',
        formOrder: 20,
      },
      hp: {
        description: 'กำลังมอเตอร์',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1500, step: 10, unit: 'hp' },
        sortable: true,
        unit: 'hp',
        formOrder: 20,
      },
      torque: {
        description: 'แรงบิดสูงสุด',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 2000, step: 10, unit: 'Nm' },
        sortable: true,
        unit: 'Nm',
        formOrder: 21,
      },
      acceleration: {
        description: 'อัตราเร่ง 0-100 กม./ชม.',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 20, step: 0.1, unit: 'วินาที' },
        sortable: true,
        unit: 'วินาที',
        formOrder: 22,
      },
      top_speed: {
        description: 'ความเร็วสูงสุด',
        group: 'performance',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 400, step: 5, unit: 'กม./ชม.' },
        sortable: true,
        unit: 'กม./ชม.',
        formOrder: 23,
      },
      price: {
        description: 'ราคาขาย (บาท)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 20000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 30,
      },
      price_thb: {
        description: 'ราคาขาย (บาท)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 20000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 30,
      },
      msrp: {
        description: 'ราคาแนะนำ (MSRP)',
        group: 'pricing',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 20000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 31,
      },
      color: {
        description: 'สีของรถรุ่นพิเศษ',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 40,
      },
      color_exterior: {
        description: 'สีภายนอก',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 41,
      },
      color_interior: {
        description: 'สีภายใน',
        group: 'design',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 42,
      },
      features: {
        description: 'รายการฟีเจอร์พิเศษ (JSON)',
        group: 'design',
        type: 'json',
        formOrder: 50,
      },
      images: {
        description: 'รูปภาพรถ (สูงสุด 5 ภาพ) — วาง URL ในแต่ละช่อง',
        group: 'design',
        type: 'image_gallery',
        formOrder: 51,
      },
      image_url: {
        description: 'URL รูปภาพรถ (เดิม — ใช้ฟิลด์ "รูปภาพรถ" แทน)',
        group: 'design',
        type: 'text',
        formOrder: 52,
        tableVisibility: 'hidden',
      },
    },
  },

  // ---------- Comparison ----------
  {
    id: 'avatr_comparison',
    label: 'เปรียบเทียบรุ่น',
    group: 'รถ AVATR',
    subGroup: 'เปรียบเทียบ',
    icon: 'GitCompare',
    description: 'เปรียบเทียบระหว่างรุ่น AVATR',
    primaryDisplayField: 'model',
    fieldGroups: [
      { key: 'basic',   label: 'ข้อมูลพื้นฐาน', defaultOpen: true  },
      { key: 'compare', label: 'รายละเอียดเปรียบเทียบ', defaultOpen: true },
    ],
    columnMeta: {
      model: {
        description: 'ชื่อรุ่นที่นำมาเปรียบเทียบ',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      variant: {
        description: 'รุ่นย่อยที่เปรียบเทียบ',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 2,
      },
      category: {
        description: 'หมวดหมู่ของข้อมูลที่เปรียบเทียบ',
        group: 'compare',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 3,
      },
    },
  },
  {
    id: 'avatr_11_sr_vs_lr',
    label: '11 SR vs LR',
    group: 'รถ AVATR',
    subGroup: 'เปรียบเทียบ',
    icon: 'Scale',
    description: 'เปรียบเทียบ AVATR 11 SR กับ LR',
    primaryDisplayField: 'category',
    fieldGroups: [
      { key: 'basic',   label: 'ข้อมูลพื้นฐาน', defaultOpen: true  },
      { key: 'compare', label: 'ค่าที่เปรียบเทียบ', defaultOpen: true },
    ],
    columnMeta: {
      category: {
        description: 'หมวดของรายการเปรียบเทียบ',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      sr_value: {
        description: 'ค่าของรุ่น SR',
        group: 'compare',
        type: 'text',
        formOrder: 2,
      },
      lr_value: {
        description: 'ค่าของรุ่น LR',
        group: 'compare',
        type: 'text',
        formOrder: 3,
      },
      sort_order: {
        description: 'ลำดับการแสดงผล',
        group: 'basic',
        type: 'number',
        sortable: true,
        formOrder: 4,
      },
    },
  },

  // ---------- Pricing / Finance ----------
  {
    id: 'promotion_pricing',
    label: 'โปรโมชั่น',
    group: 'ราคา & โปรโมชั่น',
    icon: 'Tag',
    description: 'โปรโมชั่นและส่วนลด',
    primaryDisplayField: 'title',
    groupByField: 'applies_to_model',
    groupByLabel: 'รุ่นรถ',
    fieldGroups: [
      { key: 'basic',  label: 'ข้อมูลพื้นฐาน',  defaultOpen: true  },
      { key: 'scope',  label: 'ขอบเขตโปรโมชั่น', defaultOpen: true  },
      { key: 'period', label: 'ระยะเวลา',         defaultOpen: true  },
      { key: 'detail', label: 'รายละเอียด',       defaultOpen: false },
    ],
    columnMeta: {
      title: {
        description: 'ชื่อ/หัวข้อของโปรโมชั่น',
        group: 'basic',
        type: 'text',
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      name: {
        description: 'ชื่อโปรโมชั่น',
        group: 'basic',
        type: 'text',
        sortable: true,
        formOrder: 2,
      },
      category: {
        description: 'หมวดหมู่โปรโมชั่น',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 3,
      },
      is_active: {
        description: 'เปิดใช้งานโปรโมชั่นนี้หรือไม่',
        group: 'basic',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 4,
      },
      active: {
        description: 'เปิดใช้งานโปรโมชั่นนี้หรือไม่',
        group: 'basic',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 4,
      },
      start_date: {
        description: 'วันที่เริ่มต้นโปรโมชั่น',
        group: 'period',
        type: 'date',
        filterable: { kind: 'dateRange' },
        sortable: true,
        formOrder: 10,
      },
      end_date: {
        description: 'วันที่สิ้นสุดโปรโมชั่น',
        group: 'period',
        type: 'date',
        filterable: { kind: 'dateRange' },
        sortable: true,
        formOrder: 11,
      },
      valid_until: {
        description: 'วันหมดอายุของโปรโมชั่น',
        group: 'period',
        type: 'date',
        filterable: { kind: 'dateRange' },
        sortable: true,
        formOrder: 12,
      },
      discount: {
        description: 'มูลค่าส่วนลด',
        group: 'detail',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 1000000, step: 1000 },
        sortable: true,
        formOrder: 20,
      },
      price: {
        description: 'ราคาหลังส่วนลด',
        group: 'detail',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 20000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 21,
      },
      description: {
        description: 'รายละเอียดของโปรโมชั่น',
        group: 'detail',
        type: 'longtext',
        formOrder: 30,
      },
      detail: {
        description: 'รายละเอียดของโปรโมชั่น',
        group: 'detail',
        type: 'longtext',
        formOrder: 30,
      },
      details: {
        description: 'รายละเอียดของโปรโมชั่น',
        group: 'detail',
        type: 'longtext',
        formOrder: 30,
      },
      applies_to_model: {
        description: 'ใช้ได้กับรุ่นรถใด',
        group: 'scope',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 6,
        enumOptions: [
          { value: 'avatr_07',       label: 'AVATR 07' },
          { value: 'avatr_11',       label: 'AVATR 11' },
          { value: 'avatr_11_royal', label: 'AVATR 11 Royal' },
          { value: 'all',            label: 'ทุกรุ่น' },
        ],
      },
      applies_to_color: {
        description: 'สีของรถที่ใช้โปรโมชั่นนี้ได้',
        group: 'scope',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 7,
      },
      images: {
        description: 'รูปภาพแบนเนอร์โปรโมชั่น (สูงสุด 5 ภาพ)',
        group: 'detail',
        type: 'image_gallery',
        formOrder: 31,
      },
      image_url: {
        description: 'URL รูปแบนเนอร์ (เดิม — ใช้ฟิลด์ "รูปภาพ" แทน)',
        group: 'detail',
        type: 'text',
        formOrder: 32,
        tableVisibility: 'hidden',
      },
    },
  },
  {
    id: 'installment_plans',
    label: 'แผนผ่อน',
    group: 'ราคา & โปรโมชั่น',
    icon: 'Calculator',
    description: 'แผนการผ่อนชำระ',
    primaryDisplayField: 'name',
    groupByField: 'applies_to_model',
    groupByLabel: 'รุ่นรถ',
    fieldGroups: [
      { key: 'basic',   label: 'ข้อมูลพื้นฐาน',  defaultOpen: true  },
      { key: 'scope',   label: 'ขอบเขต',          defaultOpen: true  },
      { key: 'terms',   label: 'เงื่อนไขการผ่อน', defaultOpen: true  },
      { key: 'amounts', label: 'จำนวนเงิน',       defaultOpen: false },
    ],
    columnMeta: {
      name: {
        description: 'ชื่อแผนผ่อนชำระ',
        group: 'basic',
        type: 'text',
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      bank: {
        description: 'ธนาคารที่ให้บริการแผนนี้',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
      },
      bank_name: {
        description: 'ชื่อธนาคาร',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
      },
      term_months: {
        description: 'ระยะเวลาผ่อน (เดือน)',
        group: 'terms',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 120, step: 6, unit: 'เดือน' },
        sortable: true,
        unit: 'เดือน',
        formOrder: 10,
      },
      term: {
        description: 'ระยะเวลาผ่อน',
        group: 'terms',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 120, step: 6 },
        sortable: true,
        formOrder: 10,
      },
      interest_rate: {
        description: 'อัตราดอกเบี้ยต่อปี',
        group: 'terms',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 30, step: 0.1, unit: '%' },
        sortable: true,
        unit: '%',
        formOrder: 11,
      },
      down_payment: {
        description: 'จำนวนเงินดาวน์',
        group: 'amounts',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 5000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 20,
      },
      monthly_payment: {
        description: 'ค่างวดต่อเดือน',
        group: 'amounts',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 200000, step: 1000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 21,
      },
      is_active: {
        description: 'เปิดใช้งานแผนนี้หรือไม่',
        group: 'basic',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 5,
      },
      applies_to_model: {
        description: 'ใช้ได้กับรุ่นรถใด',
        group: 'scope',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 6,
        enumOptions: [
          { value: 'avatr_07',       label: 'AVATR 07' },
          { value: 'avatr_11',       label: 'AVATR 11' },
          { value: 'avatr_11_royal', label: 'AVATR 11 Royal' },
          { value: 'all',            label: 'ทุกรุ่น' },
        ],
      },
      applies_to_color: {
        description: 'สีของรถที่ใช้แผนนี้ได้',
        group: 'scope',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 7,
      },
    },
  },
  {
    id: 'financial_lease',
    label: 'Financial Lease',
    group: 'ราคา & โปรโมชั่น',
    icon: 'FileText',
    description: 'ข้อมูลสินเชื่อเช่าซื้อ',
    primaryDisplayField: 'bank',
    fieldGroups: [
      { key: 'partner', label: 'ผู้ให้บริการ',          defaultOpen: true  },
      { key: 'rate',    label: 'อัตราดอกเบี้ย & ระยะเวลา', defaultOpen: true  },
      { key: 'amounts', label: 'จำนวนเงิน',             defaultOpen: true  },
      { key: 'detail',  label: 'รายละเอียดเพิ่มเติม',    defaultOpen: false },
      { key: 'status',  label: 'สถานะ',                  defaultOpen: false },
    ],
    columnMeta: {
      bank: {
        description: 'ธนาคารหรือสถาบันการเงิน',
        group: 'partner',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      bank_name: {
        description: 'ชื่อธนาคาร',
        group: 'partner',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
      },
      name: {
        description: 'ชื่อแพ็คเกจสินเชื่อ',
        group: 'partner',
        type: 'text',
        sortable: true,
        formOrder: 3,
      },
      interest_rate: {
        description: 'อัตราดอกเบี้ยต่อปี',
        group: 'rate',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 30, step: 0.1, unit: '%' },
        sortable: true,
        unit: '%',
        formOrder: 10,
      },
      term_months: {
        description: 'ระยะเวลาเช่าซื้อ (เดือน)',
        group: 'rate',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 120, step: 6, unit: 'เดือน' },
        sortable: true,
        unit: 'เดือน',
        formOrder: 11,
      },
      down_payment: {
        description: 'จำนวนเงินดาวน์',
        group: 'amounts',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 5000000, step: 10000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 20,
      },
      monthly_payment: {
        description: 'ค่างวดต่อเดือน',
        group: 'amounts',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 200000, step: 1000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 21,
      },
      description: {
        description: 'รายละเอียดเงื่อนไขสินเชื่อ',
        group: 'detail',
        type: 'longtext',
        formOrder: 30,
      },
      is_active: {
        description: 'เปิดใช้งานแพ็คเกจนี้หรือไม่',
        group: 'status',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 40,
      },
    },
  },
  {
    id: 'financial_partners',
    label: 'ธนาคารพันธมิตร',
    group: 'ราคา & โปรโมชั่น',
    icon: 'Building2',
    description: 'สถาบันการเงิน/ธนาคารพันธมิตร',
    primaryDisplayField: 'bank_name',
    fieldGroups: [
      { key: 'basic',   label: 'ข้อมูลพื้นฐาน', defaultOpen: true  },
      { key: 'contact', label: 'ข้อมูลติดต่อ',   defaultOpen: false },
      { key: 'detail',  label: 'รายละเอียด',     defaultOpen: false },
    ],
    columnMeta: {
      bank_name: {
        description: 'ชื่อธนาคารพันธมิตร',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      bank: {
        description: 'รหัส/ชื่อสั้นธนาคาร',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
      },
      name: {
        description: 'ชื่อพันธมิตร',
        group: 'basic',
        type: 'text',
        sortable: true,
        formOrder: 3,
      },
      phone: {
        description: 'เบอร์ติดต่อธนาคาร',
        group: 'contact',
        type: 'text',
        formOrder: 10,
      },
      email: {
        description: 'อีเมลติดต่อ',
        group: 'contact',
        type: 'text',
        formOrder: 11,
      },
      url: {
        description: 'เว็บไซต์ของธนาคาร',
        group: 'contact',
        type: 'text',
        formOrder: 12,
      },
      description: {
        description: 'รายละเอียดของพันธมิตร',
        group: 'detail',
        type: 'longtext',
        formOrder: 20,
      },
      is_active: {
        description: 'ยังเป็นพันธมิตรอยู่หรือไม่',
        group: 'basic',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 5,
      },
    },
  },
  {
    id: 'insurance_axa',
    label: 'ประกันภัย AXA',
    group: 'ราคา & โปรโมชั่น',
    icon: 'ShieldCheck',
    description: 'ข้อมูลประกันภัย AXA',
    primaryDisplayField: 'name',
    fieldGroups: [
      { key: 'basic',    label: 'ข้อมูลพื้นฐาน', defaultOpen: true  },
      { key: 'coverage', label: 'ความคุ้มครอง',  defaultOpen: true  },
      { key: 'detail',   label: 'รายละเอียด',    defaultOpen: false },
    ],
    columnMeta: {
      name: {
        description: 'ชื่อแพ็คเกจประกัน',
        group: 'basic',
        type: 'text',
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      title: {
        description: 'หัวข้อแพ็คเกจประกัน',
        group: 'basic',
        type: 'text',
        sortable: true,
        formOrder: 1,
      },
      type: {
        description: 'ประเภทประกัน เช่น ชั้น 1, ชั้น 2+',
        group: 'basic',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 2,
        enumOptions: [
          { value: 'class_1',  label: 'ชั้น 1' },
          { value: 'class_2',  label: 'ชั้น 2' },
          { value: 'class_2plus', label: 'ชั้น 2+' },
          { value: 'class_3',  label: 'ชั้น 3' },
          { value: 'class_3plus', label: 'ชั้น 3+' },
        ],
      },
      category: {
        description: 'หมวดหมู่ของประกัน',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 3,
      },
      price: {
        description: 'เบี้ยประกัน (บาท)',
        group: 'coverage',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 200000, step: 1000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 10,
      },
      coverage: {
        description: 'วงเงินคุ้มครอง',
        group: 'coverage',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 50000000, step: 100000, unit: 'บาท' },
        sortable: true,
        unit: 'บาท',
        formOrder: 11,
      },
      term: {
        description: 'ระยะเวลาคุ้มครอง',
        group: 'coverage',
        type: 'text',
        formOrder: 12,
      },
      description: {
        description: 'รายละเอียดของแพ็คเกจประกัน',
        group: 'detail',
        type: 'longtext',
        formOrder: 20,
      },
      is_active: {
        description: 'เปิดขายแพ็คเกจนี้หรือไม่',
        group: 'basic',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 5,
      },
    },
  },

  // ---------- Content ----------
  {
    id: 'faq',
    label: 'FAQ',
    group: 'ระบบ',
    icon: 'HelpCircle',
    description: 'คำถามที่พบบ่อย',
    primaryDisplayField: 'question',
    customView: 'faq-tabs',
    fieldGroups: [
      { key: 'content',  label: 'คำถาม-คำตอบ',     defaultOpen: true },
      { key: 'taxonomy', label: 'หมวดหมู่ / แท็ก', defaultOpen: true },
      { key: 'meta',     label: 'การจัดลำดับ',     defaultOpen: false },
    ],
    columnMeta: {
      scope: {
        description: 'ขอบเขตของคำถาม — ใช้ทั่วไปหรือเฉพาะรุ่นรถใด',
        group: 'taxonomy',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 0,
        enumOptions: [
          { value: 'general',        label: 'ทั่วไป' },
          { value: 'avatr_07',       label: 'AVATR 07' },
          { value: 'avatr_11',       label: 'AVATR 11' },
          { value: 'avatr_11_royal', label: 'AVATR 11 Royal' },
        ],
      },
      question: {
        description: 'คำถามที่ลูกค้าถามบ่อย',
        group: 'content',
        type: 'text',
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      answer: {
        description: 'คำตอบสำหรับคำถามนี้',
        group: 'content',
        type: 'longtext',
        formOrder: 2,
      },
      category: {
        description: 'หมวดหมู่ของคำถาม',
        group: 'taxonomy',
        type: 'text',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 3,
      },
      keywords: {
        description: 'คำสำคัญที่ใช้ค้นหา',
        group: 'taxonomy',
        type: 'text',
        formOrder: 4,
      },
      tags: {
        description: 'แท็กของคำถาม',
        group: 'taxonomy',
        type: 'text',
        formOrder: 5,
      },
      sort_order: {
        description: 'ลำดับการแสดงผล',
        group: 'meta',
        type: 'number',
        sortable: true,
        formOrder: 10,
      },
      is_active: {
        description: 'เปิดแสดง FAQ นี้หรือไม่',
        group: 'meta',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 11,
      },
    },
  },

  // ---------- CRM / Chatbot data ----------
  {
    id: 'lead_master',
    label: 'รายชื่อลูกค้า',
    group: 'ลูกค้า & แชท',
    icon: 'Users',
    description: 'ข้อมูลลูกค้า / Lead ทั้งหมด',
    primaryDisplayField: 'customer_name',
    fieldGroups: [
      { key: 'identity',   label: 'ข้อมูลลูกค้า',  defaultOpen: true  },
      { key: 'qualifying', label: 'การให้คะแนน',   defaultOpen: true  },
      { key: 'tracking',   label: 'การติดต่อ',     defaultOpen: false },
      { key: 'notes',      label: 'หมายเหตุ',      defaultOpen: false },
    ],
    columnMeta: {
      customer_name: {
        description: 'ชื่อ-นามสกุลของลูกค้า',
        group: 'identity',
        type: 'text',
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      display_name: {
        description: 'ชื่อที่แสดงผล (จาก LINE ฯลฯ)',
        group: 'identity',
        type: 'text',
        sortable: true,
        formOrder: 2,
      },
      phone: {
        description: 'เบอร์โทรของลูกค้า',
        group: 'identity',
        type: 'text',
        formOrder: 3,
      },
      email: {
        description: 'อีเมลของลูกค้า',
        group: 'identity',
        type: 'text',
        formOrder: 4,
      },
      line_user_id: {
        description: 'LINE User ID',
        group: 'identity',
        type: 'text',
        formOrder: 5,
      },
      lead_score: {
        description: 'คะแนนคุณภาพ Lead',
        group: 'qualifying',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 100, step: 1 },
        sortable: true,
        formOrder: 10,
      },
      score: {
        description: 'คะแนนรวม',
        group: 'qualifying',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 100, step: 1 },
        sortable: true,
        formOrder: 10,
      },
      status: {
        description: 'สถานะของ Lead',
        group: 'qualifying',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 11,
        enumOptions: [
          { value: 'new',       label: 'ใหม่' },
          { value: 'contacted', label: 'ติดต่อแล้ว' },
          { value: 'qualified', label: 'เข้าเกณฑ์' },
          { value: 'lost',      label: 'หลุด' },
          { value: 'won',       label: 'ปิดการขาย' },
        ],
      },
      stage: {
        description: 'ขั้นตอนใน Sales Pipeline',
        group: 'qualifying',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 12,
        enumOptions: [
          { value: 'awareness',    label: 'รับรู้' },
          { value: 'interest',     label: 'สนใจ' },
          { value: 'consideration', label: 'พิจารณา' },
          { value: 'decision',     label: 'ตัดสินใจ' },
          { value: 'purchased',    label: 'ซื้อแล้ว' },
        ],
      },
      intent: {
        description: 'ระดับความสนใจซื้อ',
        group: 'qualifying',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 13,
        enumOptions: [
          { value: 'high',   label: 'สูง' },
          { value: 'medium', label: 'กลาง' },
          { value: 'low',    label: 'ต่ำ' },
        ],
      },
      anger_level: {
        description: 'ระดับความไม่พอใจของลูกค้า',
        group: 'qualifying',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10, step: 1 },
        sortable: true,
        formOrder: 14,
      },
      last_interaction: {
        description: 'เวลาที่คุยล่าสุด',
        group: 'tracking',
        type: 'timestamp',
        filterable: { kind: 'dateRange' },
        sortable: true,
        formOrder: 20,
      },
      last_contact: {
        description: 'เวลาที่ติดต่อล่าสุด',
        group: 'tracking',
        type: 'timestamp',
        filterable: { kind: 'dateRange' },
        sortable: true,
        formOrder: 21,
      },
      notes: {
        description: 'หมายเหตุของพนักงานขาย',
        group: 'notes',
        type: 'longtext',
        formOrder: 30,
      },
      note: {
        description: 'หมายเหตุ',
        group: 'notes',
        type: 'longtext',
        formOrder: 30,
      },
    },
  },
  {
    id: 'interaction_log',
    label: 'ประวัติการสนทนา',
    group: 'ลูกค้า & แชท',
    icon: 'MessageSquare',
    description: 'บันทึกการสนทนากับลูกค้า แยกตาม LINE channel',
    primaryDisplayField: 'message',
    customView: 'chat-view',
    fieldGroups: [
      { key: 'basic',   label: 'ข้อความ',      defaultOpen: true },
      { key: 'meta',    label: 'ข้อมูลเสริม', defaultOpen: false },
    ],
    columnMeta: {
      line_user_id: {
        description: 'LINE User ID (ใช้แยกเป็น channel ในหน้า Chat)',
        group: 'meta',
        type: 'text',
        filterable: { kind: 'text' },
        sortable: true,
        formOrder: 0,
      },
      message: {
        description: 'ข้อความที่ส่ง/รับ',
        group: 'basic',
        type: 'longtext',
        tableVisibility: 'always',
        formOrder: 1,
      },
      content: {
        description: 'เนื้อหาข้อความ',
        group: 'basic',
        type: 'longtext',
        formOrder: 2,
      },
      role: {
        description: 'บทบาทของผู้ส่ง',
        group: 'basic',
        type: 'enum',
        filterable: { kind: 'enum' },
        sortable: true,
        formOrder: 3,
        enumOptions: [
          { value: 'user',      label: 'ลูกค้า' },
          { value: 'assistant', label: 'AI' },
          { value: 'system',    label: 'ระบบ' },
        ],
      },
      sender: {
        description: 'ผู้ส่งข้อความ',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 4,
      },
      event_type: {
        description: 'ประเภทเหตุการณ์',
        group: 'meta',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 5,
      },
      timestamp: {
        description: 'เวลาเกิดข้อความ',
        group: 'meta',
        type: 'timestamp',
        filterable: { kind: 'dateRange' },
        sortable: true,
        formOrder: 10,
      },
    },
  },
  {
    id: 'message_buffer',
    label: 'ข้อความค้างส่ง',
    group: 'ลูกค้า & แชท',
    icon: 'Inbox',
    description: 'ข้อความ buffer (session management)',
    primaryDisplayField: 'user_id',
    fieldGroups: [
      { key: 'basic', label: 'ข้อความ', defaultOpen: true },
      { key: 'meta',  label: 'ข้อมูลเซสชั่น', defaultOpen: false },
    ],
    columnMeta: {
      user_id: {
        description: 'รหัสผู้ใช้เจ้าของข้อความ',
        group: 'meta',
        type: 'text',
        filterable: { kind: 'text' },
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      message: {
        description: 'ข้อความที่อยู่ใน buffer',
        group: 'basic',
        type: 'longtext',
        formOrder: 2,
      },
      content: {
        description: 'เนื้อหาข้อความ',
        group: 'basic',
        type: 'longtext',
        formOrder: 3,
      },
      session_id: {
        description: 'รหัส session',
        group: 'meta',
        type: 'text',
        formOrder: 4,
      },
      timestamp: {
        description: 'เวลาที่ข้อความเข้ามา',
        group: 'meta',
        type: 'timestamp',
        filterable: { kind: 'dateRange' },
        sortable: true,
        formOrder: 5,
      },
    },
  },
  {
    id: 'scoring_rules',
    label: 'กฎการให้คะแนน Lead',
    group: 'ระบบ',
    icon: 'Target',
    description: 'กฎการให้คะแนน Lead',
    primaryDisplayField: 'rule_name',
    fieldGroups: [
      { key: 'basic',   label: 'ข้อมูลพื้นฐาน', defaultOpen: true },
      { key: 'scoring', label: 'การให้คะแนน',   defaultOpen: true },
    ],
    columnMeta: {
      rule_name: {
        description: 'ชื่อของกฎ',
        group: 'basic',
        type: 'text',
        sortable: true,
        tableVisibility: 'always',
        formOrder: 1,
      },
      condition: {
        description: 'เงื่อนไขที่ต้องเข้าเกณฑ์',
        group: 'basic',
        type: 'longtext',
        formOrder: 2,
      },
      category: {
        description: 'หมวดหมู่ของกฎ',
        group: 'basic',
        type: 'text',
        filterable: { kind: 'enum' },
        formOrder: 3,
      },
      points: {
        description: 'คะแนนที่ได้เมื่อกฎทำงาน',
        group: 'scoring',
        type: 'number',
        filterable: { kind: 'range', min: -100, max: 100, step: 1 },
        sortable: true,
        formOrder: 10,
      },
      weight: {
        description: 'น้ำหนักของกฎ',
        group: 'scoring',
        type: 'number',
        filterable: { kind: 'range', min: 0, max: 10, step: 0.1 },
        sortable: true,
        formOrder: 11,
      },
      is_active: {
        description: 'เปิดใช้งานกฎนี้หรือไม่',
        group: 'basic',
        type: 'boolean',
        filterable: { kind: 'boolean' },
        sortable: true,
        formOrder: 4,
      },
    },
  },
]

export const TABLE_BY_ID = Object.fromEntries(TABLES.map((t) => [t.id, t]))

// Order in which sidebar groups appear (top to bottom).
export const GROUP_ORDER = [
  'รถ AVATR',
  'ราคา & โปรโมชั่น',
  'ลูกค้า & แชท',
  'ระบบ',
]

// lucide-react icon name per group — referenced by Layout.
export const GROUP_ICONS = {
  'รถ AVATR': 'Car',
  'ราคา & โปรโมชั่น': 'Tag',
  'ลูกค้า & แชท': 'MessageSquare',
  ระบบ: 'Settings',
}

const _rawGroups = TABLES.reduce((acc, t) => {
  acc[t.group] = acc[t.group] || []
  acc[t.group].push(t)
  return acc
}, {})

// TABLE_GROUPS respects GROUP_ORDER, then appends any groups not listed
// in GROUP_ORDER (e.g. legacy / future names) so nothing disappears.
export const TABLE_GROUPS = Object.fromEntries(
  [
    ...GROUP_ORDER.filter((g) => _rawGroups[g]?.length > 0),
    ...Object.keys(_rawGroups).filter((g) => !GROUP_ORDER.includes(g)),
  ].map((g) => [g, _rawGroups[g]])
)

// Columns that should always be read-only (auto-managed by DB)
export const READONLY_COLUMNS = new Set([
  'id',
  'created_at',
  'updated_at',
  'inserted_at',
])

// Column label dictionary — maps DB column names to Thai labels.
export const COMMON_COLUMN_LABELS = {
  // Identifiers
  id: 'รหัส',
  user_id: 'User ID',
  line_user_id: 'LINE User ID',

  // Timestamps
  created_at: 'วันที่สร้าง',
  updated_at: 'อัปเดตล่าสุด',
  inserted_at: 'วันที่บันทึก',
  last_interaction: 'คุยล่าสุด',
  last_contact: 'ติดต่อล่าสุด',
  timestamp: 'เวลา',

  // Common vehicle fields
  variant: 'รุ่นย่อย',
  model: 'รุ่น',
  trim: 'Trim',
  color: 'สี',
  color_exterior: 'สีภายนอก',
  color_interior: 'สีภายใน',
  exterior_color: 'สีภายนอก',
  interior_color: 'สีภายใน',
  price: 'ราคา (บาท)',
  price_thb: 'ราคา (บาท)',
  msrp: 'ราคาแนะนำ',
  discount: 'ส่วนลด',
  range_km: 'ระยะทาง (กม.)',
  battery_kwh: 'แบตเตอรี่ (kWh)',
  horsepower: 'แรงม้า',
  hp: 'แรงม้า',
  torque: 'แรงบิด (Nm)',
  acceleration: 'อัตราเร่ง 0-100',
  top_speed: 'ความเร็วสูงสุด',
  features: 'ฟีเจอร์',
  image_url: 'รูปภาพ (URL เดิม)',
  image: 'รูปภาพ',
  images: 'รูปภาพ',
  applies_to_model: 'ใช้ได้กับรุ่น',
  applies_to_color: 'สีของรถ',
  scope: 'ขอบเขต',

  // FAQ / content
  question: 'คำถาม',
  answer: 'คำตอบ',
  category: 'หมวดหมู่',
  keywords: 'คำสำคัญ',
  tags: 'แท็ก',

  // Promotion
  title: 'หัวข้อ',
  name: 'ชื่อ',
  description: 'คำอธิบาย',
  detail: 'รายละเอียด',
  details: 'รายละเอียด',
  start_date: 'วันที่เริ่ม',
  end_date: 'วันที่สิ้นสุด',
  valid_until: 'หมดอายุ',
  active: 'เปิดใช้งาน',
  is_active: 'เปิดใช้งาน',

  // Finance
  bank: 'ธนาคาร',
  bank_name: 'ชื่อธนาคาร',
  interest_rate: 'อัตราดอกเบี้ย (%)',
  term_months: 'ระยะเวลา (เดือน)',
  term: 'ระยะเวลา',
  down_payment: 'เงินดาวน์',
  monthly_payment: 'ผ่อนต่อเดือน',

  // CRM
  customer_name: 'ชื่อลูกค้า',
  display_name: 'ชื่อที่แสดง',
  phone: 'เบอร์โทร',
  email: 'อีเมล',
  status: 'สถานะ',
  stage: 'ขั้นตอน',
  intent: 'ความสนใจ',
  anger_level: 'ระดับความไม่พอใจ',
  lead_score: 'คะแนน Lead',
  score: 'คะแนน',
  notes: 'หมายเหตุ',
  note: 'หมายเหตุ',

  // Interaction log
  message: 'ข้อความ',
  reply: 'คำตอบ',
  role: 'บทบาท',
  sender: 'ผู้ส่ง',
  content: 'เนื้อหา',
  event_type: 'ประเภทเหตุการณ์',

  // Scoring rules
  rule_name: 'ชื่อกฎ',
  condition: 'เงื่อนไข',
  points: 'คะแนน',
  weight: 'น้ำหนัก',

  // Generic
  url: 'ลิงก์',
  link: 'ลิงก์',
  sort_order: 'ลำดับ',
  order: 'ลำดับ',
  type: 'ประเภท',
}

/**
 * Get a human-friendly label for a column.
 * Priority: table-specific > common dictionary > prettify the raw name.
 */
export function columnLabel(table, columnKey) {
  if (table?.columnLabels?.[columnKey]) return table.columnLabels[columnKey]
  if (COMMON_COLUMN_LABELS[columnKey]) return COMMON_COLUMN_LABELS[columnKey]
  return columnKey
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Columns that are shown in the table list view but get demoted to "show on expand"
// (cluttery internals users usually don't need to see up front)
export const TECHNICAL_COLUMNS = new Set([
  'id',
  'user_id',
  'line_user_id',
  'session_id',
  'external_id',
  'raw',
  'metadata',
  'meta',
])

// =====================================================================
// Field-group / column-meta helpers
// =====================================================================

// Default field groups used when a table doesn't define its own.
// "system" is appended automatically for read-only columns (id/timestamps).
export const DEFAULT_FIELD_GROUPS = [
  { key: 'main', label: 'ข้อมูลทั่วไป', defaultOpen: true },
  { key: 'other', label: 'อื่นๆ', defaultOpen: false },
]

export const SYSTEM_FIELD_GROUP = {
  key: 'system',
  label: 'ข้อมูลระบบ',
  defaultOpen: false,
}

const SYSTEM_COL_KEYS = new Set([
  'id',
  'created_at',
  'updated_at',
  'inserted_at',
  'user_id',
  'line_user_id',
  'session_id',
  'external_id',
])

/**
 * Resolve full metadata for a single column.
 * Priority: table.columnMeta[col] > sensible auto-defaults.
 *
 * Returns a normalised shape:
 *   { description, group, type, filterable, sortable, tableVisibility,
 *     formOrder, enumOptions, unit }
 *
 * `type` here is the *config* override; if absent, callers should fall back
 * to the runtime-inferred type from utils.inferSchema().
 */
export function getColumnMeta(table, columnKey) {
  const explicit = table?.columnMeta?.[columnKey] || {}
  const isSystem = SYSTEM_COL_KEYS.has(columnKey) || READONLY_COLUMNS.has(columnKey)
  const isTechnical = TECHNICAL_COLUMNS.has(columnKey)

  return {
    description: explicit.description ?? null,
    group: explicit.group ?? (isSystem ? 'system' : null),
    type: explicit.type ?? null,
    filterable: explicit.filterable ?? null,
    sortable: explicit.sortable ?? false,
    tableVisibility:
      explicit.tableVisibility ?? (isTechnical ? 'hidden' : 'default'),
    formOrder: explicit.formOrder ?? null,
    enumOptions: explicit.enumOptions ?? null,
    unit: explicit.unit ?? null,
  }
}

/**
 * Resolve the ordered list of field groups for a table, with a "system" group
 * appended if any columns belong to it. Falls back to DEFAULT_FIELD_GROUPS.
 */
export function getFieldGroups(table) {
  const explicit = Array.isArray(table?.fieldGroups) && table.fieldGroups.length > 0
    ? table.fieldGroups
    : DEFAULT_FIELD_GROUPS
  // Always make sure 'system' is present at the end (auto-appended once)
  if (!explicit.some((g) => g.key === 'system')) {
    return [...explicit, SYSTEM_FIELD_GROUP]
  }
  return explicit
}

/**
 * Group a list of inferred columns by table.fieldGroups.
 *
 * @param {object} table   table config
 * @param {Array}  columns array of { key, type, readOnly } from inferSchema()
 * @returns {Array<{ key, label, defaultOpen, columns: Array }>}
 *
 * Columns that don't match any group fall into the LAST non-system group
 * (or a synthesised "อื่นๆ" group if the table only defines specific groups).
 */
export function groupedColumns(table, columns) {
  const groups = getFieldGroups(table)
  const buckets = new Map()
  for (const g of groups) buckets.set(g.key, [])

  // Ensure there's a fallback bucket for stray columns
  let fallbackKey = groups.find((g) => g.key !== 'system')?.key
  if (!buckets.has('other') && fallbackKey === undefined) {
    buckets.set('other', [])
    fallbackKey = 'other'
  }

  // If table has explicit fieldGroups, prefer 'other' as overflow if present;
  // else use the last non-system group as fallback.
  if (buckets.has('other')) fallbackKey = 'other'
  else {
    const nonSystem = groups.filter((g) => g.key !== 'system')
    fallbackKey = nonSystem.length > 0 ? nonSystem[nonSystem.length - 1].key : 'system'
  }

  for (const col of columns) {
    const meta = getColumnMeta(table, col.key)
    let groupKey = meta.group
    if (!groupKey || !buckets.has(groupKey)) {
      // System/readOnly columns always go to 'system' bucket if present
      if (col.readOnly && buckets.has('system')) groupKey = 'system'
      else groupKey = fallbackKey
    }
    buckets.get(groupKey).push({ ...col, meta })
  }

  // Build ordered output, dropping empty groups so headers don't show empty spans
  const out = []
  for (const g of groups) {
    const items = buckets.get(g.key) || []
    if (items.length === 0) continue
    // Within a group: respect formOrder if set, otherwise stable order
    items.sort((a, b) => {
      const ao = a.meta.formOrder ?? Infinity
      const bo = b.meta.formOrder ?? Infinity
      if (ao !== bo) return ao - bo
      return 0
    })
    out.push({ ...g, columns: items })
  }
  // Append synthetic "other" if anything ended up there but it wasn't declared
  if (!groups.some((g) => g.key === 'other') && buckets.get('other')?.length) {
    out.push({
      key: 'other',
      label: 'อื่นๆ',
      defaultOpen: false,
      columns: buckets.get('other'),
    })
  }
  return out
}

/**
 * Return the list of columns that have a filterable definition.
 * Each entry: { key, label, kind, enumOptions?, min?, max?, step?, unit? }
 */
export function filterableColumns(table, columns) {
  const out = []
  for (const col of columns) {
    const meta = getColumnMeta(table, col.key)
    if (!meta.filterable) continue
    out.push({
      key: col.key,
      label: columnLabel(table, col.key),
      kind: meta.filterable.kind,
      enumOptions: meta.filterable.enumOptions ?? meta.enumOptions ?? null,
      min: meta.filterable.min ?? null,
      max: meta.filterable.max ?? null,
      step: meta.filterable.step ?? null,
      unit: meta.filterable.unit ?? meta.unit ?? null,
      type: col.type,
    })
  }
  return out
}

/**
 * Default-visible column keys for a table (used by DataTable column-visibility menu).
 * Excludes columns whose tableVisibility is 'hidden'. Always includes 'always'.
 */
export function defaultVisibleColumnKeys(table, columns) {
  const out = new Set()
  for (const col of columns) {
    const meta = getColumnMeta(table, col.key)
    if (meta.tableVisibility === 'hidden') continue
    out.add(col.key)
  }
  return out
}

/**
 * The column key to use as the row's "title" — preferred display in delete
 * confirmations and row identity highlighting. Falls back to common candidates
 * if not explicitly set.
 */
export function primaryDisplayKey(table, columns) {
  if (table?.primaryDisplayField) return table.primaryDisplayField
  const candidates = [
    'name',
    'title',
    'variant',
    'rule_name',
    'question',
    'customer_name',
    'display_name',
    'bank_name',
    'bank',
    'category',
  ]
  const colKeys = new Set(columns.map((c) => c.key))
  for (const c of candidates) if (colKeys.has(c)) return c
  return null
}
