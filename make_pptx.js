const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10" x 5.625"
pres.title = "SepsisGuard - AI-Powered ICU Monitor";

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = "070D1A";   // very dark navy
const BG2    = "0F172A";   // slate-950
const CARD   = "1A2744";   // card bg
const CARD2  = "0D1F38";   // darker card
const CYAN   = "06B6D4";
const CYAN2  = "0E7490";
const VIOLET = "8B5CF6";
const VBKG   = "2D1B69";
const EMERALD= "10B981";
const RED    = "EF4444";
const AMBER  = "F59E0B";
const WHITE  = "FFFFFF";
const MUTED  = "94A3B8";
const SLATE7 = "334155";
const SLATE6 = "475569";

// ── Helpers ───────────────────────────────────────────────────────────────────
function rect(slide, x, y, w, h, fill, line) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: fill },
    line: line || { color: fill, width: 0 },
  });
}

function card(slide, x, y, w, h, accentColor) {
  rect(slide, x, y, w, h, CARD2, { color: accentColor || SLATE7, width: 1 });
  rect(slide, x, y, w, 0.055, accentColor || CYAN, { color: accentColor || CYAN, width: 0 });
}

function txt(slide, text, x, y, w, h, opts) {
  slide.addText(text, { x, y, w, h, margin: 0, ...opts });
}

function label(slide, text, x, y, w, color, size, bold) {
  txt(slide, text, x, y, w, 0.35,
    { fontSize: size || 10, color: color || WHITE, bold: !!bold,
      fontFace: "Calibri", valign: "middle", align: "left" });
}

// ============================================================================
// SLIDE 1 — TITLE
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };

  // Full-width cyan top stripe (thin)
  rect(s, 0, 0, 10, 0.07, CYAN);

  // Left accent bar
  rect(s, 0.55, 1.1, 0.08, 3.3, CYAN);

  // Title
  txt(s, "SepsisGuard", 0.75, 1.0, 8, 1.4,
    { fontSize: 72, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

  // Cyan accent on title
  txt(s, ".", 0.75, 1.0, 8, 1.4,
    { fontSize: 72, fontFace: "Calibri", bold: true, color: CYAN, valign: "middle", align: "right" });

  // Subtitle
  txt(s, "Real-Time AI-Powered Sepsis Detection", 0.75, 2.45, 8.5, 0.55,
    { fontSize: 22, fontFace: "Calibri", color: MUTED, valign: "middle" });

  // Tagline pill
  rect(s, 0.75, 3.15, 4.8, 0.48, CARD2, { color: CYAN, width: 1 });
  txt(s, "Built on Confluent Cloud  |  Hackathon 2026", 0.75, 3.15, 4.8, 0.48,
    { fontSize: 13, fontFace: "Calibri", color: CYAN, bold: true, valign: "middle", align: "center" });

  // Stat note
  rect(s, 0.75, 3.85, 8.5, 0.65, "150A0A", { color: RED, width: 1 });
  txt(s, "270,000 Americans die from sepsis annually  —  every hour of delay increases mortality by 7%",
    0.85, 3.85, 8.3, 0.65,
    { fontSize: 12, fontFace: "Calibri", color: "FFAAAA", italic: true, valign: "middle" });

  // Bottom
  rect(s, 0, 5.55, 10, 0.075, SLATE7);
}

// ============================================================================
// SLIDE 2 — PROBLEM
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG2 };

  txt(s, "The Problem with ICU Monitoring Today", 0.5, 0.2, 9, 0.6,
    { fontSize: 28, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });
  rect(s, 0.5, 0.78, 2.5, 0.03, CYAN);

  const problems = [
    { icon: "01", text: "Vitals checked every 4 hours — sepsis strikes in minutes",     sub: "Manual monitoring creates dangerous blind spots during rapid deterioration" },
    { icon: "02", text: "Siloed systems — no real-time cross-signal correlation",        sub: "HR, BP, SpO₂, lactate sit in separate systems with no unified risk signal" },
    { icon: "03", text: "Nurses monitor 6+ patients — critical deterioration missed",   sub: "Cognitive overload means subtle early-warning signs go unnoticed until crisis" },
  ];

  problems.forEach((p, i) => {
    const y = 1.0 + i * 1.35;
    rect(s, 0.5, y, 0.07, 1.1, RED);
    rect(s, 0.65, y, 8.9, 1.1, CARD2, { color: SLATE7, width: 1 });

    // Number badge
    rect(s, 0.72, y + 0.15, 0.55, 0.55, "3B0000", { color: RED, width: 1 });
    txt(s, p.icon, 0.72, y + 0.15, 0.55, 0.55,
      { fontSize: 14, fontFace: "Calibri", bold: true, color: RED, valign: "middle", align: "center" });

    txt(s, p.text, 1.38, y + 0.1, 8.0, 0.42,
      { fontSize: 15, fontFace: "Calibri", bold: true, color: WHITE, valign: "top" });
    txt(s, p.sub, 1.38, y + 0.55, 8.0, 0.45,
      { fontSize: 11, fontFace: "Calibri", color: MUTED, valign: "top" });
  });

  // Bottom callout
  rect(s, 0.5, 5.05, 9.0, 0.45, "141F12", { color: EMERALD, width: 1 });
  txt(s, "qSOFA score ≥2 = high sepsis risk  —  currently detected too late with manual spot checks",
    0.65, 5.05, 8.8, 0.45,
    { fontSize: 12, fontFace: "Calibri", color: EMERALD, bold: true, valign: "middle", align: "center" });
}

// ============================================================================
// SLIDE 3 — SOLUTION
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG2 };

  txt(s, "SepsisGuard: Real-Time Sepsis Intelligence", 0.5, 0.15, 9, 0.55,
    { fontSize: 28, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });
  txt(s, "Powered by Confluent Stream Processing", 0.5, 0.68, 9, 0.35,
    { fontSize: 14, fontFace: "Calibri", color: CYAN, valign: "middle" });

  const features = [
    { num: "01", color: CYAN,    title: "Real-Time Vitals Streaming",
      body: "8 ICU patients\n9 vital signs tracked\nEvent every 4 seconds\nIdempotent Kafka producer" },
    { num: "02", color: VIOLET,  title: "AI Risk Scoring",
      body: "qSOFA clinical scoring\nSIRS augmented algorithm\n0–10 continuous risk scale\nCRITICAL alerts <100ms" },
    { num: "03", color: EMERALD, title: "Instant Alerting",
      body: "WebSocket push to dashboard\nReal-time alert panel\nPatient sorted by risk level\nSparkline vitals history" },
    { num: "04", color: AMBER,   title: "Stream Governance",
      body: "JSON Schema Registry\nBACKWARD compatibility\nSchema evolution ready\nData lineage tracking" },
  ];

  features.forEach((f, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 4.78;
    const y = 1.15 + row * 2.12;

    rect(s, x, y, 4.55, 1.95, CARD2, { color: f.color, width: 1 });
    rect(s, x, y, 4.55, 0.055, f.color, { color: f.color, width: 0 });

    // Number badge
    rect(s, x + 0.2, y + 0.18, 0.5, 0.5, CARD2, { color: f.color, width: 1.5 });
    txt(s, f.num, x + 0.2, y + 0.18, 0.5, 0.5,
      { fontSize: 12, fontFace: "Calibri", bold: true, color: f.color, valign: "middle", align: "center" });

    txt(s, f.title, x + 0.85, y + 0.18, 3.5, 0.45,
      { fontSize: 14, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

    const lines = f.body.split("\n").map((text, li) => ({
      text,
      options: { breakLine: li < f.body.split("\n").length - 1, fontSize: 10.5, color: MUTED,
                 fontFace: "Calibri" }
    }));
    s.addText(lines, { x: x + 0.85, y: y + 0.7, w: 3.55, h: 1.1, margin: 0, valign: "top" });
  });
}

// ============================================================================
// SLIDE 4 — ARCHITECTURE (most important)
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };

  txt(s, "Built on Confluent Cloud — End to End", 0.4, 0.12, 9.2, 0.55,
    { fontSize: 27, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

  // Confluent badge top-right
  rect(s, 7.8, 0.1, 1.85, 0.42, "141F2E", { color: CYAN, width: 1 });
  txt(s, "Confluent Cloud / GCP", 7.8, 0.1, 1.85, 0.42,
    { fontSize: 8.5, fontFace: "Calibri", bold: true, color: CYAN, valign: "middle", align: "center" });

  // ── Node definitions ────────────────────────────────────────────────────────
  // Row 1 (y=0.9): Producer | icu-vitals | Processor
  // Row 2 (y=3.05): sepsis-alerts | Backend | Dashboard
  // Vertical connector on right side between Processor and sepsis-alerts

  const BW = 2.58, BH = 0.78;
  const COL = [0.55, 3.71, 6.87]; // x positions for 3 columns
  const ROW = [0.85, 3.0];        // y positions for 2 rows

  // Compute nodes style
  function computeNode(x, y, label1, label2) {
    rect(s, x, y, BW, BH, "0C2035", { color: CYAN, width: 1.5 });
    rect(s, x, y, BW, 0.06, CYAN, { color: CYAN, width: 0 });
    txt(s, label1, x + 0.12, y + 0.1, BW - 0.24, 0.35,
      { fontSize: 11, fontFace: "Calibri", bold: true, color: WHITE, valign: "top" });
    txt(s, label2, x + 0.12, y + 0.44, BW - 0.24, 0.28,
      { fontSize: 8.5, fontFace: "Calibri", color: CYAN, valign: "top" });
  }

  function topicNode(x, y, label1, label2) {
    rect(s, x, y, BW, BH, VBKG, { color: VIOLET, width: 1.5 });
    rect(s, x, y, BW, 0.06, VIOLET, { color: VIOLET, width: 0 });
    txt(s, label1, x + 0.12, y + 0.1, BW - 0.24, 0.35,
      { fontSize: 11, fontFace: "Calibri", bold: true, color: WHITE, valign: "top" });
    txt(s, label2, x + 0.12, y + 0.44, BW - 0.24, 0.28,
      { fontSize: 8.5, fontFace: "Calibri", color: VIOLET, valign: "top" });
  }

  // Row 1
  computeNode(COL[0], ROW[0], "Python Producer", "ICU Vitals Generator");
  topicNode  (COL[1], ROW[0], "icu-vitals", "Kafka Topic");
  computeNode(COL[2], ROW[0], "Stream Processor", "Sepsis Scorer");

  // Row 2 (sepsis-alerts aligns with Processor, then goes left)
  topicNode  (COL[2], ROW[1], "sepsis-alerts", "Kafka Topic");
  computeNode(COL[1], ROW[1], "FastAPI Backend", "Consumer Group");
  computeNode(COL[0], ROW[1], "React Dashboard", "WebSocket Client");

  // ── Arrows ──────────────────────────────────────────────────────────────────
  function arrowH(x, y) {
    s.addShape(pres.shapes.LINE, { x, y, w: 0.55, h: 0,
      line: { color: CYAN, width: 1.5 } });
    txt(s, "▶", x + 0.28, y - 0.15, 0.3, 0.3,
      { fontSize: 9, color: CYAN, align: "center", valign: "middle" });
  }

  function arrowLeft(x, y) {
    s.addShape(pres.shapes.LINE, { x, y, w: 0.55, h: 0,
      line: { color: VIOLET, width: 1.5 } });
    txt(s, "◄", x + 0.05, y - 0.15, 0.3, 0.3,
      { fontSize: 9, color: VIOLET, align: "center", valign: "middle" });
  }

  const R1MID = ROW[0] + BH / 2;
  const R2MID = ROW[1] + BH / 2;
  arrowH(COL[0] + BW, R1MID - 0.02);   // Producer → icu-vitals
  arrowH(COL[1] + BW, R1MID - 0.02);   // icu-vitals → Processor

  // Vertical connector: Processor → sepsis-alerts
  const VX = COL[2] + BW / 2;
  s.addShape(pres.shapes.LINE, { x: VX, y: ROW[0] + BH, w: 0, h: ROW[1] - (ROW[0] + BH),
    line: { color: SLATE6, width: 1.5, dashType: "dash" } });
  txt(s, "▼", VX - 0.15, ROW[1] - 0.22, 0.3, 0.3,
    { fontSize: 9, color: SLATE6, align: "center", valign: "middle" });

  arrowLeft(COL[1] + BW, R2MID - 0.02); // sepsis-alerts ← Backend
  arrowLeft(COL[0] + BW, R2MID - 0.02); // Backend ← Dashboard

  // ── Detail cards ────────────────────────────────────────────────────────────
  const DY1 = ROW[0] + BH + 0.1;
  const DY2 = ROW[1] + BH + 0.12;
  const DH  = 0.75;

  function detailCard(x, y, lines, color) {
    rect(s, x, y, BW, DH, "0A1628", { color: color, width: 1 });
    const items = lines.map((t, i) => ({
      text: t, options: { breakLine: i < lines.length - 1, fontSize: 8, color: MUTED, fontFace: "Calibri" }
    }));
    s.addText(items, { x: x + 0.12, y: y + 0.08, w: BW - 0.24, h: DH - 0.16, margin: 0, valign: "top" });
  }

  detailCard(COL[0], DY1, ["Python confluent-kafka", "9 vital signs / event", "4s interval", "Idempotent delivery"], CYAN);
  detailCard(COL[1], DY1, ["3 partitions", "JSON Schema governed", "BACKWARD compat", "GCP us-east1"], VIOLET);
  detailCard(COL[2], DY1, ["Consumer group", "qSOFA + SIRS scoring", "Real-time enrichment", "Publishes to alerts topic"], CYAN);

  detailCard(COL[2], DY2, ["3 partitions", "Risk level + score", "Clinical flags", "Schema governed"], VIOLET);
  detailCard(COL[1], DY2, ["Consumer group", "WebSocket broadcast", "<100ms latency", "In-memory state"], CYAN);
  detailCard(COL[0], DY2, ["8 patients live", "Real-time charts", "Alert sidebar", "Governance panel"], CYAN);
}

// ============================================================================
// SLIDE 5 — GOVERNANCE
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG2 };

  txt(s, "Stream Governance with Confluent Schema Registry", 0.4, 0.15, 9.2, 0.55,
    { fontSize: 26, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

  const cols = [
    {
      x: 0.4, color: VIOLET, title: "Schema Registry",
      items: [
        "JSON Schema for icu-vitals-value",
        "JSON Schema for sepsis-alerts-value",
        "BACKWARD compatibility enforced",
        "Schema evolution: add fields without breaking consumers",
        "12 required fields validated per vitals event",
        "8 required fields validated per alert event",
      ],
    },
    {
      x: 3.73, color: CYAN, title: "Confluent APIs Used",
      items: [
        "Producer API (idempotent vitals ingestion)",
        "Consumer Group API (processor + backend)",
        "Admin API (topic mgmt & E2E verification)",
        "Kafka Consumer (stream processing)",
        "WebSocket bridge (real-time delivery)",
        "Schema Registry REST API (governance)",
      ],
    },
    {
      x: 7.06, color: EMERALD, title: "Stream Governance Rules",
      items: [
        "Required field enforcement on every event",
        "Idempotent producer (exactly-once delivery)",
        "Consumer group isolation: processor vs backend",
        "Offset management (auto.offset.reset=latest)",
        "SASL/SSL authentication on all connections",
        "Topic partitioning: 3 partitions per topic",
      ],
    },
  ];

  cols.forEach(col => {
    const CW = 2.9;
    rect(s, col.x, 0.85, CW, 4.55, CARD2, { color: col.color, width: 1.5 });
    rect(s, col.x, 0.85, CW, 0.055, col.color, { color: col.color, width: 0 });

    txt(s, col.title, col.x + 0.15, 0.92, CW - 0.3, 0.45,
      { fontSize: 13, fontFace: "Calibri", bold: true, color: col.color, valign: "middle" });

    col.items.forEach((item, i) => {
      const iy = 1.5 + i * 0.55;
      rect(s, col.x + 0.18, iy + 0.1, 0.08, 0.08, col.color, { color: col.color, width: 0 });
      txt(s, item, col.x + 0.35, iy, CW - 0.5, 0.48,
        { fontSize: 10, fontFace: "Calibri", color: MUTED, valign: "middle" });
    });
  });
}

// ============================================================================
// SLIDE 6 — LIVE DEMO RESULTS
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG2 };

  txt(s, "Verified Live on Confluent Cloud", 0.4, 0.15, 9, 0.55,
    { fontSize: 28, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

  // Checklist (left)
  const checks = [
    { label: "Broker connectivity", detail: "pkc-619z3.us-east1.gcp.confluent.cloud:9092" },
    { label: "icu-vitals topic",     detail: "3 partitions — 13 messages received in 8s window" },
    { label: "sepsis-alerts topic",  detail: "3 partitions — 10 messages received in 8s window" },
    { label: "End-to-end latency",   detail: "Producer → Dashboard in under 100ms" },
    { label: "Stream processor",     detail: "Consuming, scoring, and re-publishing in real-time" },
    { label: "WebSocket clients",    detail: "3 concurrent dashboard connections verified" },
  ];

  checks.forEach((c, i) => {
    const y = 0.88 + i * 0.72;
    rect(s, 0.4, y, 5.7, 0.62, CARD2, { color: SLATE7, width: 1 });

    // Green check circle
    rect(s, 0.52, y + 0.11, 0.4, 0.4, "0A2A1A", { color: EMERALD, width: 1.5 });
    txt(s, "✓", 0.52, y + 0.11, 0.4, 0.4,
      { fontSize: 14, fontFace: "Calibri", bold: true, color: EMERALD, valign: "middle", align: "center" });

    txt(s, c.label, 1.05, y + 0.04, 4.9, 0.3,
      { fontSize: 12, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });
    txt(s, c.detail, 1.05, y + 0.32, 4.9, 0.25,
      { fontSize: 9.5, fontFace: "Calibri", color: MUTED, valign: "middle" });
  });

  // Alert sample card (right)
  const ax = 6.3, aw = 3.35;
  rect(s, ax, 0.88, aw, 4.44, "1A0808", { color: RED, width: 1.5 });
  rect(s, ax, 0.88, aw, 0.055, RED, { color: RED, width: 0 });
  txt(s, "LIVE ALERT SAMPLE", ax, 0.93, aw, 0.35,
    { fontSize: 9, fontFace: "Calibri", bold: true, color: RED, valign: "middle", align: "center" });

  const alertFields = [
    ["Patient",  "Emily Zhang, 63y, ICU-B"],
    ["Risk",     "CRITICAL"],
    ["Score",    "7.5 / 10.0"],
    ["qSOFA",    "3 / 3"],
    ["Flags", "High respiratory rate (>=22/min)"],
    ["",      "Low systolic BP (<=100 mmHg)"],
    ["",      "Altered mentation (GCS=7)"],
    ["",      "Critical lactate (4.9 mmol/L)"],
    ["",      "Severe hypoxia (SpO2=87.4%)"],
  ];

  alertFields.forEach((row, i) => {
    const fy = 1.38 + i * 0.37;
    if (row[0]) {
      txt(s, row[0], ax + 0.18, fy, 0.85, 0.32,
        { fontSize: 8.5, fontFace: "Calibri", color: MUTED, valign: "middle" });
    }
    txt(s, row[1], ax + 1.1, fy, aw - 1.2, 0.32,
      { fontSize: row[0] === "Risk" ? 12 : 9.5,
        fontFace: "Calibri",
        bold: row[0] === "Risk",
        color: row[0] === "Risk" ? RED : WHITE,
        valign: "middle" });
  });
}

// ============================================================================
// SLIDE 7 — TECH STACK
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG2 };

  txt(s, "Technology Stack", 0.4, 0.15, 9, 0.55,
    { fontSize: 30, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

  const columns = [
    {
      x: 0.4, color: CYAN, title: "Confluent Cloud", sub: "Core Infrastructure",
      items: [
        ["Apache Kafka", "GCP us-east1 cluster"],
        ["icu-vitals", "3 partitions, JSON Schema"],
        ["sepsis-alerts", "3 partitions, JSON Schema"],
        ["Schema Registry", "BACKWARD compat enforced"],
        ["Producer API", "Idempotent delivery"],
        ["Consumer Groups", "Processor + Backend"],
        ["Admin API", "Cluster mgmt & verification"],
      ],
    },
    {
      x: 5.2, color: VIOLET, title: "Application Layer", sub: "Open Source Stack",
      items: [
        ["Python 3.14", "Producer + Stream Processor"],
        ["confluent-kafka", "Official Python client"],
        ["FastAPI", "Backend API + WebSockets"],
        ["React + TypeScript", "Real-time dashboard"],
        ["Recharts", "Live vitals chart sparklines"],
        ["Tailwind CSS", "Dark ICU theme"],
        ["qSOFA + SIRS", "Clinical scoring algorithm"],
      ],
    },
  ];

  columns.forEach(col => {
    const CW = 4.4;
    rect(s, col.x, 0.85, CW, 4.55, CARD2, { color: col.color, width: 1.5 });
    rect(s, col.x, 0.85, CW, 0.055, col.color, { color: col.color, width: 0 });

    txt(s, col.title, col.x + 0.2, 0.92, CW - 0.4, 0.38,
      { fontSize: 15, fontFace: "Calibri", bold: true, color: col.color, valign: "middle" });
    txt(s, col.sub, col.x + 0.2, 1.28, CW - 0.4, 0.28,
      { fontSize: 10, fontFace: "Calibri", color: MUTED, valign: "middle" });

    col.items.forEach((item, i) => {
      const iy = 1.68 + i * 0.54;
      rect(s, col.x + 0.2, iy + 0.14, 0.07, 0.07, col.color, { color: col.color, width: 0 });
      txt(s, item[0], col.x + 0.4, iy, 1.5, 0.48,
        { fontSize: 11, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });
      txt(s, item[1], col.x + 1.95, iy, CW - 2.2, 0.48,
        { fontSize: 10, fontFace: "Calibri", color: MUTED, valign: "middle" });
    });
  });
}

// ============================================================================
// SLIDE 8 — IMPACT & NEXT STEPS
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG2 };

  txt(s, "Impact & What's Next", 0.4, 0.15, 9, 0.52,
    { fontSize: 28, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

  // Big stat cards
  const stats = [
    { value: "270K",   label: "Annual US sepsis deaths",   color: RED    },
    { value: "<100ms", label: "Detection to alert latency",color: CYAN   },
    { value: "8",      label: "Patients monitored live",   color: VIOLET },
    { value: "9",      label: "Vital signs tracked / event",color: EMERALD },
  ];

  stats.forEach((st, i) => {
    const x = 0.4 + i * 2.32;
    rect(s, x, 0.8, 2.15, 1.45, CARD2, { color: st.color, width: 1.5 });
    rect(s, x, 0.8, 2.15, 0.055, st.color, { color: st.color, width: 0 });
    txt(s, st.value, x, 0.88, 2.15, 0.75,
      { fontSize: 40, fontFace: "Calibri", bold: true, color: st.color, align: "center", valign: "middle" });
    txt(s, st.label, x + 0.1, 1.58, 1.95, 0.55,
      { fontSize: 9.5, fontFace: "Calibri", color: MUTED, align: "center", valign: "top" });
  });

  // Next steps
  txt(s, "Roadmap: Deeper Confluent Integration", 0.4, 2.4, 9, 0.38,
    { fontSize: 14, fontFace: "Calibri", bold: true, color: CYAN, valign: "middle" });

  const steps = [
    { icon: "01", text: "Confluent Flink", detail: "Stateful stream processing — detect multi-event deterioration patterns over time windows" },
    { icon: "02", text: "ksqlDB",          detail: "Real-time SQL queries on vitals streams — 'ALERT WHERE lactate > 4 AND spo2 < 90'" },
    { icon: "03", text: "Kafka Connect",   detail: "EHR system connectors for Epic and Cerner — replace synthetic data with real patient feeds" },
    { icon: "04", text: "Claude AI",       detail: "Natural language clinical summaries per patient — 'Maria is showing early septic shock signs'" },
  ];

  steps.forEach((st, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.4 + col * 4.78;
    const y = 2.9 + row * 1.2;
    rect(s, x, y, 4.55, 1.05, CARD2, { color: SLATE7, width: 1 });

    rect(s, x + 0.15, y + 0.25, 0.42, 0.42, CARD2, { color: CYAN, width: 1.5 });
    txt(s, st.icon, x + 0.15, y + 0.25, 0.42, 0.42,
      { fontSize: 9, fontFace: "Calibri", bold: true, color: CYAN, valign: "middle", align: "center" });

    txt(s, st.text, x + 0.72, y + 0.1, 3.6, 0.38,
      { fontSize: 12, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });
    txt(s, st.detail, x + 0.72, y + 0.5, 3.68, 0.48,
      { fontSize: 9, fontFace: "Calibri", color: MUTED, valign: "top" });
  });
}

// ============================================================================
// SLIDE 9 — CLOSING
// ============================================================================
{
  const s = pres.addSlide();
  s.background = { color: BG };

  rect(s, 0, 0, 10, 0.07, CYAN);
  rect(s, 0, 5.555, 10, 0.07, CYAN);

  // Left accent
  rect(s, 0.55, 1.2, 0.08, 3.2, CYAN);

  txt(s, "SepsisGuard", 0.75, 1.05, 8.5, 1.5,
    { fontSize: 68, fontFace: "Calibri", bold: true, color: WHITE, valign: "middle" });

  txt(s, "Real-time sepsis detection — because every second counts",
    0.75, 2.65, 8.5, 0.6,
    { fontSize: 20, fontFace: "Calibri", color: MUTED, valign: "middle", italic: true });

  // 3 bottom chips
  const chips = ["Built with Confluent Cloud", "Hackathon 2026", "End-to-End Verified"];
  const chipColors = [CYAN, VIOLET, EMERALD];
  const chipBgs = ["0A1E28", "1A0D3B", "0A1F17"];
  chips.forEach((chip, i) => {
    const cx = 0.75 + i * 2.95;
    rect(s, cx, 3.65, 2.7, 0.52, chipBgs[i], { color: chipColors[i], width: 1 });
    txt(s, chip, cx, 3.65, 2.7, 0.52,
      { fontSize: 11, fontFace: "Calibri", bold: true, color: chipColors[i], valign: "middle", align: "center" });
  });

  // Cluster info
  txt(s, "pkc-619z3.us-east1.gcp.confluent.cloud:9092",
    0.75, 4.5, 8.5, 0.35,
    { fontSize: 9, fontFace: "Calibri", color: SLATE6, valign: "middle", align: "center" });
}

// ============================================================================
// WRITE FILE
// ============================================================================
pres.writeFile({ fileName: "C:\\Users\\barot\\OneDrive\\Desktop\\code\\project\\SepsisGuard_Hackathon.pptx" })
  .then(() => console.log("Saved: SepsisGuard_Hackathon.pptx"))
  .catch(e => { console.error("ERROR:", e); process.exit(1); });
