import type { Dataset, FunctionId, Row } from "./types";

/* Deterministic PRNG so every participant sees the same data (and the same planted anomalies). */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed: number) {
  const r = mulberry32(seed);
  return {
    next: r,
    int: (min: number, max: number) => Math.floor(r() * (max - min + 1)) + min,
    float: (min: number, max: number) => r() * (max - min) + min,
    pick: <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)],
    weighted: <T,>(arr: readonly T[], w: readonly number[]) => {
      const total = w.reduce((a, b) => a + b, 0);
      let x = r() * total;
      for (let i = 0; i < arr.length; i++) {
        x -= w[i];
        if (x <= 0) return arr[i];
      }
      return arr[arr.length - 1];
    },
    normal: (mean: number, sd: number) => {
      const u = 1 - r();
      const v = r();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    chance: (p: number) => r() < p,
  };
}

const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

/* Reporting window: Oct 2025 – Sep 2026 (12 months). Finance carries 24 months for YoY. */
const MONTHS = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09"];
const MONTHS_24 = ["2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09", ...MONTHS];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const FIRST = ["Aarav", "Diya", "Rohan", "Priya", "Karthik", "Ananya", "Vikram", "Meera", "Arjun", "Sneha", "Rahul", "Kavya", "Siddharth", "Neha", "Aditya", "Ishita", "Manoj", "Lakshmi", "Farhan", "Pooja", "Ravi", "Divya", "Suresh", "Nithya", "Imran", "Swathi", "Ganesh", "Ritu", "Harish", "Fatima"];
const LAST = ["Sharma", "Iyer", "Reddy", "Nair", "Patel", "Menon", "Gupta", "Krishnan", "Rao", "Das", "Singh", "Pillai", "Joshi", "Khan", "Subramanian", "Mehta", "Bose", "Varma"];
const DEPTS = ["Sales", "Engineering", "Operations", "Finance", "HR", "Marketing", "Customer Support"];

function dayInMonth(rng: ReturnType<typeof makeRng>, ym: string) {
  return `${ym}-${String(rng.int(1, 28)).padStart(2, "0")}`;
}

function messyDate(rng: ReturnType<typeof makeRng>, iso: string, p = 0.12) {
  if (!rng.chance(p)) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  return rng.pick([
    `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`,
    `${MONTH_NAMES[m - 1]} ${d} ${y}`,
    `${d}-${MONTH_NAMES[m - 1]}-${y}`,
  ]);
}

/* ---------------------------------------------------------------- L&D */
function genLD(): Row[] {
  const rng = makeRng(101);
  const courses = [
    { name: "Data Analytics 101", hours: 12, cost: 4500, score: 58, fb: 3.1, pop: 3 },
    { name: "Leadership Essentials", hours: 16, cost: 9000, score: 78, fb: 4.4, pop: 1.4 },
    { name: "Excel to AI Copilot", hours: 6, cost: 2500, score: 82, fb: 4.6, pop: 2 },
    { name: "POSH Compliance", hours: 2, cost: 600, score: 88, fb: 3.9, pop: 2.2 },
    { name: "Negotiation Skills", hours: 8, cost: 6000, score: 74, fb: 4.2, pop: 0.9 },
    { name: "Cloud Fundamentals", hours: 20, cost: 11000, score: 70, fb: 4.0, pop: 1 },
    { name: "Customer Empathy", hours: 4, cost: 1800, score: 80, fb: 4.5, pop: 1.1 },
  ];
  const rows: Row[] = [];
  let id = 1001;
  for (let i = 0; i < 260; i++) {
    const c = rng.weighted(courses, courses.map((x) => x.pop));
    const dept = rng.weighted(DEPTS, [3, 3, 2, 1, 1, 1.5, 2]);
    const completion = rng.weighted(["Completed", "In Progress", "Not Started"], [dept === "Sales" ? 4 : 7, 2, dept === "Sales" ? 2.5 : 1]);
    const score = completion === "Completed" ? Math.max(25, Math.min(100, round(rng.normal(c.score + (dept === "Engineering" ? 6 : 0), 9)))) : null;
    const hours = completion === "Completed" ? c.hours : completion === "In Progress" ? round(c.hours * rng.float(0.2, 0.8), 1) : 0;
    rows.push({
      "Employee ID": `E${id++}`,
      "Employee Name": `${rng.pick(FIRST)} ${rng.pick(LAST)}`,
      Department: dept,
      Course: c.name,
      Month: rng.pick(MONTHS),
      "Training Hours": hours,
      Completion: completion,
      "Assessment Score": score,
      "Training Cost": c.cost,
      "Feedback Score": completion === "Not Started" ? null : round(Math.max(1, Math.min(5, rng.normal(c.fb, 0.5))), 1),
    });
  }
  // planted dirt
  rows[7].Department = "sales";
  rows[19].Department = " Engineering ";
  rows[33].Department = "Engg";
  rows[52].Department = "Cust. Support";
  rows[64]["Training Cost"] = 98000; // outlier: data-entry error (extra zero)
  rows[88]["Assessment Score"] = 870; // impossible score
  rows.push({ ...rows[12] }, { ...rows[40] }); // duplicates
  return rows;
}

/* ---------------------------------------------------------------- HR */
function genHR(): Row[] {
  const rng = makeRng(202);
  const locs = ["Chennai", "Bengaluru", "Mumbai", "Pune", "Hyderabad"];
  const rows: Row[] = [];
  for (let i = 0; i < 320; i++) {
    const dept = rng.weighted(DEPTS, [3, 3.2, 2, 1, 0.8, 1.2, 2.2]);
    const tenure = round(Math.max(0.1, rng.next() < 0.35 ? rng.float(0.1, 2) : rng.float(2, 14)), 1);
    const perf = rng.weighted([1, 2, 3, 4, 5], [0.5, 1.5, 4, 3, 1.2]);
    const base = { Sales: 9, Engineering: 16, Operations: 8, Finance: 12, HR: 10, Marketing: 11, "Customer Support": 6 }[dept]!;
    const salary = round(base * 100000 * (1 + tenure * 0.06) * (0.85 + perf * 0.06) * rng.float(0.9, 1.1), -3);
    let pExit = 0.1;
    if (dept === "Sales" && tenure < 2) pExit = 0.48;
    if (dept === "Engineering" && perf >= 4 && tenure < 4) pExit = 0.32;
    if (dept === "Customer Support") pExit += 0.12;
    const exited = rng.chance(pExit);
    const first = rng.pick(FIRST);
    const last = rng.pick(LAST);
    rows.push({
      "Employee ID": `E${2000 + i}`,
      Name: `${first} ${last}`,
      Email: `${first.toLowerCase()}.${last.toLowerCase()}@acmecorp.example`,
      Phone: `+91 9${rng.int(100000000, 999999999)}`,
      Gender: rng.weighted(["Female", "Male", "Non-binary"], [44, 54, 2]),
      Age: Math.max(21, Math.min(60, round(22 + tenure + rng.float(0, 14)))),
      Department: dept,
      Location: rng.pick(locs),
      "Tenure (Years)": tenure,
      "Annual Salary (INR)": salary,
      "Performance Rating": perf,
      "Leave Days (YTD)": Math.max(0, round(rng.normal(dept === "Customer Support" ? 16 : 10, 4))),
      Status: exited ? "Exited" : "Active",
      "Exit Month": exited ? rng.weighted(MONTHS, [1, 1, 1, 1, 1, 1, 2.6, 2.4, 1, 1, 1, 1]) : null,
    });
  }
  rows[15].Department = "Engg";
  rows[61].Department = "engineering";
  rows[99].Department = "Cust Support";
  rows[23]["Annual Salary (INR)"] = null;
  rows[77]["Annual Salary (INR)"] = null;
  rows[140]["Annual Salary (INR)"] = 98000000; // outlier — extra zeros
  rows[201].Age = 7; // impossible
  rows[180].Location = "Bangalore";
  rows[181].Location = "bengaluru ";
  rows.push({ ...rows[5] }, { ...rows[150] });
  return rows;
}

/* ---------------------------------------------------------------- Recruitment */
function genRecruitment(): Row[] {
  const rng = makeRng(303);
  const roles = ["Software Engineer", "Sales Executive", "Data Analyst", "Support Associate", "Finance Associate"];
  const sources = [
    { s: "Employee Referral", vol: 0.6, conv: [0.7, 0.6, 0.55, 0.85], cost: 25000, days: 28 },
    { s: "LinkedIn", vol: 1.4, conv: [0.45, 0.45, 0.35, 0.7], cost: 18000, days: 38 },
    { s: "Job Portal", vol: 2.2, conv: [0.3, 0.38, 0.3, 0.6], cost: 9000, days: 45 },
    { s: "Campus", vol: 1.1, conv: [0.5, 0.5, 0.45, 0.65], cost: 12000, days: 52 },
    { s: "Recruitment Agency", vol: 0.7, conv: [0.55, 0.5, 0.42, 0.72], cost: 95000, days: 34 },
    { s: "Career Site", vol: 0.8, conv: [0.35, 0.42, 0.33, 0.75], cost: 4000, days: 41 },
  ];
  const rows: Row[] = [];
  for (const m of MONTHS) {
    for (const role of roles) {
      for (const src of sources) {
        const roleVol = { "Software Engineer": 1.6, "Sales Executive": 1.2, "Data Analyst": 0.8, "Support Associate": 1.4, "Finance Associate": 0.5 }[role]!;
        const apps = Math.max(2, round(rng.normal(40 * src.vol * roleVol, 8)));
        const screened = round(apps * src.conv[0] * rng.float(0.85, 1.1));
        // Engineering bottleneck at interview -> offer
        const interviewed = round(screened * src.conv[1] * rng.float(0.85, 1.1));
        const offerRate = role === "Software Engineer" ? src.conv[2] * 0.45 : src.conv[2];
        const offers = round(interviewed * offerRate * rng.float(0.8, 1.15));
        const joined = round(offers * (role === "Sales Executive" ? src.conv[3] * 0.7 : src.conv[3]) * rng.float(0.85, 1.1));
        const spike = m === "2026-04" && role === "Support Associate" ? 3.2 : 1;
        rows.push({
          Month: m,
          "Job Role": role,
          Source: src.s,
          Applications: round(apps * spike),
          Screened: round(screened * spike),
          Interviewed: Math.min(round(screened * spike), round(interviewed * spike)),
          Offers: offers,
          Joined: Math.min(offers, joined),
          "Avg Time to Hire (Days)": joined > 0 ? round(rng.normal(src.days + (role === "Software Engineer" ? 12 : 0), 5)) : null,
          "Hiring Cost (INR)": round(joined * src.cost * rng.float(0.85, 1.2), -2),
        });
      }
    }
  }
  rows[44].Source = "linkedin";
  rows[90].Source = "Referral";
  rows[133]["Avg Time to Hire (Days)"] = 410; // suspicious
  rows[210].Applications = null;
  return rows;
}

/* ---------------------------------------------------------------- Procurement */
function genProcurement(): Row[] {
  const rng = makeRng(404);
  const vendors = [
    { v: "Apex Supplies", cats: ["IT Hardware", "Office Supplies"], w: 5 },
    { v: "Bharat Logistics", cats: ["Logistics"], w: 3 },
    { v: "Nimbus Cloud Services", cats: ["Software & Cloud"], w: 3.5 },
    { v: "GreenLeaf Facilities", cats: ["Facility Services"], w: 2 },
    { v: "Sunrise Stationers", cats: ["Office Supplies"], w: 1.5 },
    { v: "Vertex Electricals", cats: ["Electrical & Maintenance"], w: 1.2 },
    { v: "Orbit Print Solutions", cats: ["Printing"], w: 0.8 },
    { v: "Kaveri Packaging", cats: ["Packaging"], w: 1.4 },
  ];
  const items: Record<string, { item: string; price: number; qty: [number, number] }[]> = {
    "IT Hardware": [
      { item: "Laptop i7 16GB", price: 78000, qty: [2, 25] },
      { item: "27in Monitor", price: 16500, qty: [2, 30] },
      { item: "Docking Station", price: 9800, qty: [2, 20] },
    ],
    "Office Supplies": [
      { item: "A4 Paper (box)", price: 1450, qty: [10, 120] },
      { item: "Whiteboard Markers (pack)", price: 380, qty: [10, 80] },
    ],
    Logistics: [{ item: "Freight - Chennai to Pune", price: 42000, qty: [1, 6] }],
    "Software & Cloud": [
      { item: "Cloud Compute (monthly)", price: 265000, qty: [1, 1] },
      { item: "SaaS Licence Seat", price: 2200, qty: [20, 200] },
    ],
    "Facility Services": [{ item: "Housekeeping (monthly)", price: 185000, qty: [1, 1] }],
    "Electrical & Maintenance": [{ item: "UPS Battery", price: 12500, qty: [2, 20] }],
    Printing: [{ item: "Brochure Print (1000)", price: 14000, qty: [1, 8] }],
    Packaging: [{ item: "Corrugated Box (100)", price: 2600, qty: [5, 60] }],
  };
  const rows: Row[] = [];
  let po = 50001;
  for (let i = 0; i < 360; i++) {
    const vend = rng.weighted(vendors, vendors.map((v) => v.w));
    const cat = rng.pick(vend.cats);
    const it = rng.pick(items[cat]);
    const m = rng.pick(MONTHS);
    const mi = MONTHS.indexOf(m);
    let price = it.price * rng.float(0.96, 1.04);
    if (vend.v === "Apex Supplies" && mi >= 6) price *= 1.19; // planted: ~19% price hike from Apr 2026
    if (vend.v === "Bharat Logistics" && mi >= 9) price *= 1.11;
    const qty = rng.int(it.qty[0], it.qty[1]);
    price = round(price);
    rows.push({
      "PO Number": `PO-${po++}`,
      Date: messyDate(rng, dayInMonth(rng, m)),
      Vendor: vend.v,
      Category: cat,
      Item: it.item,
      Quantity: qty,
      "Unit Price (INR)": price,
      "Total Amount (INR)": qty * price,
      "Payment Status": rng.weighted(["Paid", "Pending", "Overdue", "On Hold"], [7, 2, 0.8, 0.3]),
    });
  }
  rows[11].Vendor = "APEX SUPPLIES";
  rows[57].Vendor = "Apex Supplies Pvt Ltd";
  rows[102].Vendor = "Nimbus Cloud";
  rows[140].Category = "IT hardware";
  rows[190]["Total Amount (INR)"] = Number(rows[190]["Total Amount (INR)"]) * 10; // qty x price mismatch
  rows[222]["Unit Price (INR)"] = null;
  // duplicate payment risk: same vendor/amount/date, new PO number
  rows.push({ ...rows[30], "PO Number": `PO-${po++}` });
  rows.push({ ...rows[150], "PO Number": `PO-${po++}` });
  rows.push({ ...rows[75] }); // exact duplicate
  return rows;
}

/* ---------------------------------------------------------------- Finance */
function genFinance(): Row[] {
  const rng = makeRng(505);
  const depts = [
    { d: "Sales", cc: "CC-110" },
    { d: "Engineering", cc: "CC-210" },
    { d: "Marketing", cc: "CC-310" },
    { d: "Operations", cc: "CC-410" },
    { d: "HR", cc: "CC-510" },
    { d: "IT", cc: "CC-610" },
  ];
  const lines = [
    { l: "Salaries", base: 42 },
    { l: "Travel", base: 4 },
    { l: "Software", base: 6 },
    { l: "Marketing & Events", base: 5 },
  ];
  const rows: Row[] = [];
  MONTHS_24.forEach((m, mi) => {
    const growth = 1 + mi * 0.008;
    for (const { d, cc } of depts) {
      const scale = { Sales: 1.3, Engineering: 1.8, Marketing: 0.8, Operations: 1.1, HR: 0.4, IT: 0.7 }[d]!;
      for (const { l, base } of lines) {
        let budget = base * scale * growth * 100000;
        if (l === "Marketing & Events" && d !== "Marketing" && d !== "Sales") budget *= 0.15;
        if (l === "Marketing & Events" && d === "Marketing") budget *= 3;
        let actual = budget * rng.float(0.92, 1.06);
        const isQ3FY = ["2026-07", "2026-08", "2026-09"].includes(m);
        if (d === "Marketing" && l === "Marketing & Events" && isQ3FY) actual *= 1.42; // planted overspend
        if (d === "IT" && l === "Software" && mi >= 15) actual *= 1.28; // licence creep
        if (d === "Sales" && l === "Travel" && m === "2026-03") actual *= 2.6; // one-off spike
        if (d === "HR" && l === "Travel") actual *= 0.7; // underspend
        rows.push({
          Month: m,
          Department: d,
          "Cost Center": cc,
          "Line Item": l,
          "Budget (INR)": round(budget, -3),
          "Actual (INR)": round(actual, -3),
        });
      }
    }
    // Revenue lines (company level)
    const rev = 920 * 100000 * (1 + mi * 0.015) * (m.endsWith("-03") ? 1.18 : 1) * rng.float(0.95, 1.05);
    rows.push({ Month: m, Department: "Company", "Cost Center": "CC-000", "Line Item": "Revenue", "Budget (INR)": round(920 * 100000 * (1 + mi * 0.017), -3), "Actual (INR)": round(rev, -3) });
  });
  rows[60]["Actual (INR)"] = null;
  rows[300]["Department"] = "Mktg";
  return rows;
}

/* ---------------------------------------------------------------- Administration */
function genAdmin(): Row[] {
  const rng = makeRng(606);
  const types = [
    { t: "Utilities", vendor: ["TNEB / State Electricity", "Metro Water Board"], amt: 380000, rec: "Yes" },
    { t: "Facilities", vendor: ["GreenLeaf Facilities"], amt: 185000, rec: "Yes" },
    { t: "Maintenance", vendor: ["Vertex Electricals", "CoolAir HVAC"], amt: 65000, rec: "No" },
    { t: "Travel", vendor: ["SkyWays Travel Desk", "CityCab Corporate"], amt: 140000, rec: "No" },
    { t: "Security", vendor: ["ShieldGuard Services"], amt: 120000, rec: "Yes" },
    { t: "Assets", vendor: ["Apex Supplies", "Urban Furniture Co"], amt: 210000, rec: "No" },
  ];
  const locs = ["Chennai HQ", "Bengaluru", "Pune", "Mumbai"];
  const rows: Row[] = [];
  let inv = 7001;
  for (const m of MONTHS) {
    const mi = MONTHS.indexOf(m);
    for (const loc of locs) {
      for (const ty of types) {
        const n = ty.rec === "Yes" ? 1 : rng.int(0, 2);
        for (let k = 0; k < n; k++) {
          let amt = ty.amt * (loc === "Chennai HQ" ? 1.5 : rng.float(0.6, 1)) * rng.float(0.88, 1.12);
          if (ty.t === "Utilities" && ["2026-04", "2026-05", "2026-06"].includes(m)) amt *= loc === "Chennai HQ" ? 1.55 : 1.2; // summer cooling
          if (ty.t === "Travel" && mi >= 9) amt *= 1.35;
          rows.push({
            "Invoice No": `INV-${inv++}`,
            Month: m,
            Location: loc,
            "Expense Type": ty.t,
            Vendor: rng.pick(ty.vendor),
            "Amount (INR)": round(amt, -2),
            Recurring: ty.rec,
            "Asset Utilization %": ty.t === "Assets" ? round(rng.float(35, 95)) : null,
          });
        }
      }
    }
  }
  rows.push({ ...rows[20], "Invoice No": `INV-${inv++}` }); // duplicate recurring invoice
  rows[45]["Amount (INR)"] = 2450000; // outlier
  rows[80].Location = "Chennai";
  rows[81]["Expense Type"] = "utilities";
  return rows;
}

/* ---------------------------------------------------------------- Investor Relations */
function genIR(): Row[] {
  const rng = makeRng(707);
  const quarters = ["FY25 Q1", "FY25 Q2", "FY25 Q3", "FY25 Q4", "FY26 Q1", "FY26 Q2", "FY26 Q3", "FY26 Q4", "FY27 Q1", "FY27 Q2"];
  const segs = [
    { s: "Digital Services", base: 620, g: 0.035, m: 0.24 },
    { s: "Cloud & Infra", base: 410, g: 0.055, m: 0.21 },
    { s: "Consulting", base: 280, g: -0.01, m: 0.18 },
    { s: "Products & Platforms", base: 150, g: 0.07, m: 0.31 },
  ];
  const geos = [
    { g: "North America", w: 0.48 },
    { g: "Europe", w: 0.26 },
    { g: "India", w: 0.16 },
    { g: "APAC", w: 0.1 },
  ];
  const rows: Row[] = [];
  quarters.forEach((q, qi) => {
    let total = 0;
    let totalE = 0;
    const qRows: Row[] = [];
    for (const s of segs) {
      for (const g of geos) {
        let rev = s.base * g.w * (1 + s.g) ** qi * rng.float(0.97, 1.03);
        if (g.g === "Europe" && qi >= 7) rev *= 0.86; // planted: Europe softness
        let margin = s.m + rng.float(-0.015, 0.015);
        if (s.s === "Consulting" && qi >= 6) margin -= 0.05; // margin compression
        const e = rev * margin;
        total += rev;
        totalE += e;
        qRows.push({ Quarter: q, Segment: s.s, Geography: g.g, "Revenue (INR Cr)": round(rev, 1), "EBITDA (INR Cr)": round(e, 1) });
      }
    }
    const eps = round((totalE * 0.62) / 42, 2);
    for (const r of qRows) rows.push({ ...r, "Company EPS (INR)": eps, "Company Revenue (INR Cr)": round(total, 1) });
  });
  return rows;
}

/* ---------------------------------------------------------------- Legal */
function genLegal(): Row[] {
  const rng = makeRng(808);
  const types = ["Master Services Agreement", "NDA", "Statement of Work", "Office Lease", "Software Licence", "Supply Agreement"];
  const parties = ["Apex Supplies", "Nimbus Cloud Services", "Bharat Logistics", "GreenLeaf Facilities", "Zenith Bank", "Orion Analytics", "Kaveri Packaging", "Helios Energy", "Pinnacle Realty", "Quantum Soft", "Lotus Consulting", "Vertex Electricals"];
  const owners = ["Legal - Anitha", "Legal - Rajesh", "Procurement - Kiran", "Admin - Sunil"];
  const rows: Row[] = [];
  const asOf = new Date("2026-10-26");
  for (let i = 0; i < 160; i++) {
    const t = rng.weighted(types, [2, 3, 2.5, 0.6, 1.5, 1.4]);
    const start = new Date(2022, rng.int(0, 47), rng.int(1, 28));
    const termM = t === "NDA" ? 24 : t === "Office Lease" ? 60 : rng.pick([12, 24, 36]);
    const renew = new Date(start);
    renew.setMonth(renew.getMonth() + termM);
    const value = t === "NDA" ? 0 : round(rng.float(5, t === "Office Lease" ? 900 : 450) * 100000, -4);
    const risk = value > 25000000 ? rng.weighted(["High", "Medium", "Low"], [5, 3, 1]) : rng.weighted(["High", "Medium", "Low"], [1, 3, 5]);
    const status = renew < asOf ? rng.weighted(["Expired", "Renewed", "Terminated"], [3, 4, 1]) : rng.weighted(["Active", "Under Negotiation"], [8, 1]);
    rows.push({
      "Contract ID": `CTR-${3000 + i}`,
      Counterparty: rng.pick(parties),
      "Contract Type": t,
      "Contract Value (INR)": value,
      "Start Date": start.toISOString().slice(0, 10),
      "Renewal Date": renew.toISOString().slice(0, 10),
      "Risk Category": risk,
      Status: status,
      "Auto Renew": rng.weighted(["Yes", "No"], [1, 2]),
      Owner: rng.pick(owners),
    });
  }
  // planted: high-risk, high-value contracts renewing within 60 days of as-of date
  const soon = ["2026-11-08", "2026-11-19", "2026-12-02", "2026-12-15", "2026-11-30"];
  soon.forEach((d, k) => {
    const r = rows[10 + k * 17];
    r["Renewal Date"] = d;
    r["Risk Category"] = "High";
    r.Status = "Active";
    r["Auto Renew"] = k % 2 === 0 ? "Yes" : "No";
    r["Contract Value (INR)"] = round(rng.float(3, 9) * 10000000, -4);
  });
  rows[70]["Risk Category"] = "high";
  rows[71].Owner = null;
  rows[90]["Renewal Date"] = "15/01/2027";
  return rows;
}

/* ---------------------------------------------------------------- Capstone */
function genCapstone(): Row[] {
  const rng = makeRng(909);
  const depts = ["Sales", "Engineering", "Operations", "Finance", "HR", "Marketing", "Customer Support"];
  const rows: Row[] = [];
  const hc: Record<string, number> = { Sales: 140, Engineering: 210, Operations: 120, Finance: 45, HR: 30, Marketing: 55, "Customer Support": 160 };
  MONTHS.forEach((m, mi) => {
    for (const d of depts) {
      const attr = Math.max(0, round(hc[d] * (d === "Customer Support" ? 0.035 : d === "Sales" ? 0.028 : 0.012) * rng.float(0.6, 1.4) * (mi === 6 || mi === 7 ? 1.6 : 1)));
      const hires = Math.max(0, round(attr * rng.float(0.7, 1.3) + (d === "Engineering" && mi > 5 ? 4 : 0)));
      hc[d] = hc[d] - attr + hires;
      const budget = round(hc[d] * 1.25 * 100000 * (d === "Engineering" ? 1.5 : 1), -3);
      const trainingHours = round(hc[d] * rng.float(1.2, 3.2) * (d === "Sales" ? 0.5 : 1));
      rows.push({
        Month: m,
        Department: d,
        Headcount: hc[d],
        Exits: attr,
        "New Hires": hires,
        "Open Positions": Math.max(0, round(attr * 0.8 + rng.int(0, 6))),
        "Avg Time to Hire (Days)": round(rng.normal(d === "Engineering" ? 52 : 38, 6)),
        "Training Hours": trainingHours,
        "Training Spend (INR)": round(trainingHours * rng.float(700, 1100), -2),
        "Procurement Spend (INR)": round(hc[d] * rng.float(4000, 9000) * (d === "Operations" ? 2.4 : 1), -2),
        "Top Vendor": rng.pick(["Apex Supplies", "Nimbus Cloud Services", "Bharat Logistics", "GreenLeaf Facilities"]),
        "Budget (INR)": budget,
        "Actual Spend (INR)": round(budget * rng.float(0.9, 1.08) * (d === "Marketing" && mi >= 9 ? 1.35 : 1), -3),
        "Avg Performance (1-5)": round(rng.float(3, 4.1), 2),
        "Engagement Score": round(rng.float(62, 84) - (d === "Customer Support" ? 9 : 0)),
      });
    }
  });
  rows[20]["Training Hours"] = null;
  rows[47].Department = "Ops";
  return rows;
}

/* ---------------------------------------------------------------- Registry */
type Meta = Omit<Dataset, "rows" | "columns"> & { gen: () => Row[] };

const META: Meta[] = [
  {
    id: "ld",
    name: "Training & Learning Records",
    file: "ld_training_records.csv",
    func: "L&D",
    description: "One row per employee-course enrolment: hours, completion, assessment & feedback scores and cost.",
    gen: genLD,
    plantedIssues: ["Department spelled 4 different ways (sales, ' Engineering ', Engg, Cust. Support)", "Training Cost of 98,000 — likely an extra zero", "Assessment Score of 870 (impossible, max 100)", "2 exact duplicate enrolments", "Missing assessment scores for incomplete courses (expected, not an error)"],
    plantedInsights: ["'Data Analytics 101' has the highest enrolment but the lowest assessment scores and feedback", "Sales has the lowest completion rate", "Engineering scores ~6 points higher on average"],
    prompts: [
      "Analyze training effectiveness by department and identify programs that have high participation but low assessment scores.",
      "What is the cost per learner and cost per completed learner for each course?",
      "Which departments have the lowest completion rates?",
      "Is there a relationship between training hours and assessment score?",
    ],
  },
  {
    id: "hr",
    name: "Employee Master (HR)",
    file: "hr_employee_master.csv",
    func: "HR",
    description: "Employee demographics, department, tenure, salary, performance, leave and attrition status. Contains PII on purpose — try the privacy scanner.",
    gen: genHR,
    plantedIssues: ["Contains PII: Name, Email, Phone — mask before sending to any AI", "Department variants: Engg, engineering, Cust Support", "Location variants: Bangalore / bengaluru", "Salary of ₹9.8 Cr (outlier) and 2 missing salaries", "Age of 7 (impossible)", "2 duplicate employee rows"],
    plantedInsights: ["Sales attrition is concentrated in employees with < 2 years tenure", "Engineering is losing high performers (rating 4–5)", "Exits spiked in Apr–May 2026", "Customer Support has the highest leave days"],
    prompts: [
      "Analyze employee attrition by department and tenure. Identify patterns that HR should investigate further.",
      "Compare average salary by department and performance rating.",
      "Which department has the highest absenteeism (leave days)?",
      "Are we losing our high performers? Show attrition rate by performance rating.",
    ],
  },
  {
    id: "recruitment",
    name: "Recruitment Funnel",
    file: "recruitment_funnel.csv",
    func: "Recruitment",
    description: "Monthly funnel by job role and candidate source: applications → screened → interviewed → offers → joined, with time-to-hire and cost.",
    gen: genRecruitment,
    plantedIssues: ["Source variants: 'linkedin', 'Referral' vs 'Employee Referral'", "Time-to-hire of 410 days (suspicious)", "One missing Applications value"],
    plantedInsights: ["Software Engineer has a severe interview → offer bottleneck", "Employee Referral converts best; Recruitment Agency is by far the most expensive per hire", "Sales Executive offers have a weak offer → join rate", "Support Associate applications spiked 3x in Apr 2026"],
    prompts: [
      "Analyze the recruitment funnel and identify where candidates are dropping out most frequently.",
      "Which candidate source has the best conversion from application to joining, and what is the cost per hire?",
      "Compare time-to-hire across job roles.",
      "You are analyzing our recruitment data. Identify the top sources of candidates, calculate conversion rates at each recruitment stage, identify bottlenecks, and present the findings as a management summary.",
    ],
  },
  {
    id: "procurement",
    name: "Purchase Orders",
    file: "procurement_purchase_orders.csv",
    func: "Procurement",
    description: "Purchase orders with vendor, category, item, quantity, unit price, total and payment status.",
    gen: genProcurement,
    plantedIssues: ["Vendor variants: APEX SUPPLIES, Apex Supplies Pvt Ltd, Nimbus Cloud", "Mixed date formats (ISO, dd/mm/yyyy, 'Mar 4 2026')", "One PO where Total ≠ Quantity × Unit Price (10x)", "Possible duplicate payments: same vendor, item, amount and date with different PO numbers", "Missing unit price"],
    plantedInsights: ["Apex Supplies raised unit prices ~19% from Apr 2026", "Bharat Logistics raised freight ~11% from Jul 2026", "Top 2 vendors account for a large share of spend (concentration risk)"],
    prompts: [
      "Identify vendors with significant price increases compared with previous purchases.",
      "Give me the top 10 vendors by spend and their share of total spend.",
      "Identify duplicate or suspicious transactions.",
      "Show monthly purchase trends by category.",
    ],
  },
  {
    id: "finance",
    name: "Budget vs Actuals",
    file: "finance_budget_actuals.csv",
    func: "Finance",
    description: "24 months of budget vs actual by department, cost center and line item, plus company revenue.",
    gen: genFinance,
    plantedIssues: ["One missing Actual value", "Department 'Mktg' vs 'Marketing'"],
    plantedInsights: ["Marketing & Events overspent ~40% in Jul–Sep 2026", "IT Software costs creeping ~28% over budget since early 2026", "One-off Sales travel spike in Mar 2026", "HR consistently underspends travel"],
    prompts: [
      "Compare budget versus actual expenditure by department and highlight the five largest variances.",
      "Show the monthly expense trend and compare this year with last year.",
      "Which cost centers are consistently over budget?",
      "What happens to total annual expense if Software spend increases by 10%?",
    ],
  },
  {
    id: "admin",
    name: "Administrative Expenses",
    file: "admin_expenses.csv",
    func: "Administration",
    description: "Facilities, maintenance, utilities, travel, security and asset expenses by location, with recurring flag and asset utilization.",
    gen: genAdmin,
    plantedIssues: ["Duplicate recurring invoice (same vendor, month, amount)", "Amount of ₹24.5 lakh (outlier)", "Location 'Chennai' vs 'Chennai HQ'", "Expense type 'utilities' lowercase"],
    plantedInsights: ["Utilities spike in Apr–Jun 2026, strongest at Chennai HQ (summer cooling load)", "Travel cost up ~35% from Jul 2026", "Several assets below 50% utilization"],
    prompts: [
      "Show monthly administrative expenditure by expense type and highlight unusual months.",
      "Which locations have the highest utility costs and when do they peak?",
      "Identify assets with low utilization.",
      "What share of admin spend is recurring vs one-time?",
    ],
  },
  {
    id: "ir",
    name: "Quarterly Results (IR)",
    file: "ir_quarterly_results.csv",
    func: "Investor Relations",
    description: "10 quarters of revenue and EBITDA by business segment and geography, with company EPS.",
    gen: genIR,
    plantedIssues: ["Company EPS and Company Revenue repeat on every row — summing them double-counts (a classic AI mistake!)"],
    plantedInsights: ["Products & Platforms is the fastest-growing, highest-margin segment", "Europe revenue softened ~14% from FY26 Q4", "Consulting margins compressed ~5 pts from FY26 Q3"],
    prompts: [
      "Analyze the quarterly performance and identify the major changes in revenue, profitability, and segment contribution.",
      "Show quarter-on-quarter revenue growth by segment.",
      "Compute EBITDA margin by segment and how it has changed.",
      "Which geography is underperforming recently?",
    ],
  },
  {
    id: "legal",
    name: "Contract Register",
    file: "legal_contract_register.csv",
    func: "Legal",
    description: "Contract portfolio with counterparty, type, value, start and renewal dates, risk category, status and owner. As-of date: 2026-10-26.",
    gen: genLegal,
    plantedIssues: ["Risk category 'high' lowercase", "Missing contract owner", "Renewal date in dd/mm/yyyy format"],
    plantedInsights: ["5 high-risk, high-value contracts renew in the next ~60 days — some on auto-renew", "Office leases carry the largest values"],
    prompts: [
      "Group contracts by risk category and identify contracts approaching renewal.",
      "Which high-risk contracts renew in the next 90 days, and which of them auto-renew?",
      "Show total contract value by contract type and counterparty.",
      "Which owners carry the most high-risk contract value?",
    ],
  },
  {
    id: "capstone",
    name: "Org 360 Scorecard (Capstone)",
    file: "capstone_org360_scorecard.csv",
    func: "All Functions",
    description: "One common organization dataset: monthly department scorecard combining headcount, attrition, hiring, training, procurement, budget and engagement.",
    gen: genCapstone,
    plantedIssues: ["Department 'Ops' vs 'Operations'", "One missing Training Hours value"],
    plantedInsights: ["Exits spike in Apr–May 2026 across departments", "Customer Support: highest exits and lowest engagement", "Marketing over budget from Jul 2026", "Sales invests the least training hours per head"],
    prompts: [
      "What does this dataset contain, and what questions should management ask?",
      "Which departments have the highest attrition and how does it relate to engagement score?",
      "Compare budget vs actual spend by department and flag the largest overruns.",
      "Show the monthly trend of exits and new hires.",
    ],
  },
];

const cache = new Map<FunctionId, Dataset>();

export function getDataset(id: FunctionId): Dataset {
  const hit = cache.get(id);
  if (hit) return hit;
  const meta = META.find((m) => m.id === id) ?? META[0];
  const rows = meta.gen();
  const columns = Object.keys(rows[0]);
  const { gen: _gen, ...rest } = meta;
  const ds: Dataset = { ...rest, columns, rows };
  cache.set(id, ds);
  return ds;
}

export const DATASET_LIST = META.map(({ id, name, func, description, file }) => ({ id, name, func, description, file }));

export function toCSV(columns: string[], rows: Row[]) {
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.map(esc).join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))].join("\n");
}
