/**
 * 本地开发 mock 数据 seed
 *
 * 运行：
 *   pnpm db:seed          （见 package.json）
 *   或 tsx prisma/seed.ts
 *
 * 说明：
 * - 登录仅 emailOTP + Google（无密码），故数据挂到一个可登录的 demo 邮箱账号上；
 *   用该邮箱在 /login 走 emailOTP 即可在 App 里看到全部 mock 数据。
 * - 覆盖「消费决策域」当前有活跃 API 的全部表（timeline / signals / decisions /
 *   studies / consent / insights / skin-scan / experiments / hormone-layer /
 *   contributions / health-records / me-baseline），外加 wearable、subscription、
 *   notification、follow-up 等支撑数据。
 * - 幂等：先按 userId 清掉该用户既有 mock 行，再全量重插；research_study 为全局表，
 *   按 name 去重后补建。可安全重复运行。
 * - 枚举值严格对齐 src/lib/db/enums.ts。
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "./generated/client";

const DEMO_EMAIL = process.env.SEED_USER_EMAIL ?? "kissjing4003@163.com";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

// --- 时间辅助：以「现在」为基准往回推 ---
const now = new Date();
const day = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(now.getTime() - n * day);
/** 仅日期（@db.Date 字段用），归一到 UTC 00:00 */
const dateOnly = (n: number) => {
  const d = daysAgo(n);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
};

async function main() {
  console.log(`[seed] target demo email = ${DEMO_EMAIL}`);

  // 1) 确保 demo 用户存在（不存在则建一个可 emailOTP 登录的账号）
  const user = await prisma.userAccount.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      emailVerified: true,
      authProvider: "email",
      role: "user",
      subscriptionTier: "decision",
      timezone: "Asia/Shanghai",
      status: "active",
      name: "Demo User",
    },
  });
  const userId = user.id;
  console.log(`[seed] user id = ${userId}`);

  // 1b) 诊所账号（role=clinic），可 emailOTP 登录进入 clinic portal
  const clinic = await prisma.userAccount.upsert({
    where: { email: "clinic@163.com" },
    update: { role: "clinic" },
    create: {
      email: "clinic@163.com",
      emailVerified: true,
      authProvider: "email",
      role: "clinic",
      subscriptionTier: "free",
      timezone: "Asia/Shanghai",
      status: "active",
      name: "Demo Clinic",
    },
  });
  console.log(`[seed] clinic id = ${clinic.id}`);

  // 2) 幂等清理：先删子表再删父表（外键安全顺序）
  await prisma.observationEntry.deleteMany({ where: { userId } });
  await prisma.observation.deleteMany({ where: { userId } });
  await prisma.decisionEntry.deleteMany({ where: { userId } });
  await prisma.timelineEvent.deleteMany({ where: { userId } });
  await prisma.decision.deleteMany({ where: { userId } });
  await prisma.photo.deleteMany({ where: { userId } });
  await prisma.healthRecord.deleteMany({ where: { userId } });
  await prisma.healthSource.deleteMany({ where: { userId } });
  await prisma.signal.deleteMany({ where: { userId } });
  await prisma.bodyInsight.deleteMany({ where: { userId } });
  await prisma.skinScan.deleteMany({ where: { userId } });
  await prisma.experiment.deleteMany({ where: { userId } });
  await prisma.hormoneReading.deleteMany({ where: { userId } });
  await prisma.contribution.deleteMany({ where: { userId } });
  await prisma.consentSetting.deleteMany({ where: { userId } });
  await prisma.studyEnrollment.deleteMany({ where: { userId } });
  await prisma.notification.deleteMany({ where: { userId } });
  await prisma.followUpTask.deleteMany({ where: { userId } });
  await prisma.wearableDaily.deleteMany({ where: { userId } });
  await prisma.wearableConnection.deleteMany({ where: { userId } });
  await prisma.hormonalStatusLog.deleteMany({ where: { userId } });

  // 3) 皮肤基线（1:1）
  await prisma.userBaseline.upsert({
    where: { userId },
    update: {
      skinType: "combination",
      fitzpatrickScale: "III",
      hormonalStatus: "perimenopausal",
      concernGoals: ["firmness", "even-tone", "sleep-quality"],
    },
    create: {
      userId,
      skinType: "combination",
      fitzpatrickScale: "III",
      hormonalStatus: "perimenopausal",
      concernGoals: ["firmness", "even-tone", "sleep-quality"],
    },
  });

  // 4) 激素状态历史（追加不覆盖）
  await prisma.hormonalStatusLog.createMany({
    data: [
      { userId, status: "cycling", effectiveFrom: dateOnly(720) },
      { userId, status: "perimenopausal", effectiveFrom: dateOnly(180) },
    ],
  });

  // 5) Wearable 连接 + 每日汇总（近 14 天 apple_healthkit）
  await prisma.wearableConnection.createMany({
    data: [
      {
        userId,
        provider: "apple_healthkit",
        connectedAt: daysAgo(200),
        lastSyncedAt: daysAgo(0),
        isPrimary: true,
        status: "active",
      },
      {
        userId,
        provider: "oura",
        connectedAt: daysAgo(90),
        lastSyncedAt: daysAgo(1),
        isPrimary: false,
        status: "active",
      },
    ],
  });
  const wearableDailies = Array.from({ length: 14 }, (_, i) => {
    const wobble = Math.sin(i) * 6;
    return {
      userId,
      provider: "apple_healthkit",
      recordDate: dateOnly(i + 1),
      sleepScore: (78 + wobble).toFixed(1),
      deepSleepMin: Math.round(62 + wobble),
      hrvAvg: (44 + wobble * 0.6).toFixed(1),
      restingHr: Math.round(58 - wobble * 0.2),
      skinTempDelta: (wobble * 0.05).toFixed(2),
      stepCount: 6500 + Math.round(Math.abs(wobble) * 300),
      dataQuality: i % 5 === 0 ? "partial" : "complete",
    };
  });
  await prisma.wearableDaily.createMany({ data: wearableDailies });

  // 5b) 让趋势图有稳定、可读的 metric identity。迁移已经提供常用 vitals；
  // demo 额外补充本场景用到的治疗、症状和化验指标。
  await Promise.all([
    prisma.healthTreatmentMetricDefinition.upsert({
      where: { metricCode: "tretinoin" },
      update: { displayName: "Tretinoin" },
      create: {
        metricCode: "tretinoin",
        displayName: "Tretinoin",
        aliases: ["tretinoin 0.025%", "retinoid"],
      },
    }),
    prisma.healthSymptomMetricDefinition.upsert({
      where: { metricCode: "jawline_firmness" },
      update: { displayName: "Jawline firmness" },
      create: {
        metricCode: "jawline_firmness",
        displayName: "Jawline firmness",
        aliases: ["jawline laxity", "lower-face firmness"],
      },
    }),
    prisma.healthSymptomMetricDefinition.upsert({
      where: { metricCode: "sleep_quality" },
      update: { displayName: "Sleep quality" },
      create: {
        metricCode: "sleep_quality",
        displayName: "Sleep quality",
        aliases: ["sleep", "sleep score"],
      },
    }),
    prisma.healthLabMetricDefinition.upsert({
      where: { metricCode: "ldl_cholesterol" },
      update: { displayName: "LDL cholesterol", isChartable: true },
      create: {
        metricCode: "ldl_cholesterol",
        displayName: "LDL cholesterol",
        aliases: ["ldl", "ldl-c"],
        canonicalUnit: "mg/dL",
        isChartable: true,
      },
    }),
  ]);

  async function createConfirmedRecord(input: {
    kind: string;
    metricCode: string;
    title: string;
    recordedAt: Date;
    parsedValues: Prisma.InputJsonValue;
    source?: string;
    documentClass?: string;
  }) {
    const source = await prisma.healthSource.create({
      data: {
        userId,
        fileName: `${input.title} — ${input.recordedAt.toISOString().slice(0, 10)}`,
        provenance: { seeded: true },
      },
    });
    return prisma.healthRecord.create({
      data: {
        userId,
        sourceId: source.id,
        kind: input.kind,
        metricCode: input.metricCode,
        title: input.title,
        source: input.source ?? "you",
        documentClass: input.documentClass ?? null,
        status: "CONFIRMED",
        confidence: "High",
        ocrStatus: "manual",
        parsedValues: input.parsedValues,
        recordedAt: input.recordedAt,
      },
    });
  }

  // 6) 决策（3 条）+ 决策条目（append-only）+ 关联时间线
  const thermage = await prisma.decision.create({
    data: {
      userId,
      question: "Should I do Thermage for jawline firmness this year?",
      goal: "firmness",
      type: "procedure",
      topic: "Thermage",
      topicSlug: "thermage",
      lifecycle: "ACTIVE",
      decisionKind: "unconfirmed",
      brief: {
        yourHistory: [
          "Noticed lower-face laxity over the past 8 months",
          "Perimenopausal since ~6 months ago",
        ],
        similarJourneys: {
          summary: "12 members with similar baseline tried Thermage",
          note: "Most report visible firmness at 8–12 weeks, peaking ~3 months.",
        },
        evidence: {
          known: [
            "Monopolar RF stimulates collagen remodeling",
            "Single session, minimal downtime",
          ],
          uncertain: [
            "Durability beyond 12 months varies by skin baseline",
            "Perimenopausal collagen response less studied",
          ],
        },
        questionsForClinician: [
          "What tip / energy level for Fitzpatrick III?",
          "Realistic firmness expectation at 3 months?",
        ],
      },
    },
  });
  const hrt = await prisma.decision.create({
    data: {
      userId,
      question: "Is HRT right for my sleep and skin changes?",
      goal: "sleep-quality",
      type: "medication",
      topic: "HRT",
      topicSlug: "hrt",
      lifecycle: "ACTIVE",
      decisionKind: "unconfirmed",
      brief: {
        yourHistory: ["Sleep quality dropped ~15% over 3 months"],
        similarJourneys: {
          summary: "Mixed outcomes among perimenopausal members",
          note: "Sleep improvements common; skin effect slower.",
        },
        evidence: {
          known: ["Estrogen supports skin thickness and hydration"],
          uncertain: ["Individual risk/benefit needs clinician review"],
        },
        questionsForClinician: ["Am I a candidate given my history?"],
      },
    },
  });
  const retinoid = await prisma.decision.create({
    data: {
      userId,
      question: "Switch to prescription tretinoin 0.025%?",
      goal: "even-tone",
      type: "product",
      topic: "Skincare",
      topicSlug: "skincare",
      lifecycle: "DECIDED",
      decisionKind: "unconfirmed",
      decidedAt: daysAgo(20),
      brief: {
        yourHistory: ["Used OTC retinol 6 months with mild results"],
        similarJourneys: {
          summary: "Common step-up",
          note: "Expect purge weeks 2–4.",
        },
        evidence: {
          known: ["Tretinoin has strong photoaging evidence"],
          uncertain: [],
        },
        questionsForClinician: [],
      },
    },
  });

  await prisma.decisionEntry.createMany({
    data: [
      {
        decisionId: thermage.id,
        userId,
        text: "Started researching clinics and pricing.",
        lifecycleSnapshot: "ACTIVE",
        occurredAt: daysAgo(40),
      },
      {
        decisionId: thermage.id,
        userId,
        text: "Booked a consultation; moving forward.",
        lifecycleSnapshot: "ACTIVE",
        occurredAt: daysAgo(12),
      },
      {
        decisionId: hrt.id,
        userId,
        text: "Logged sleep decline; want clinician input.",
        lifecycleSnapshot: "ACTIVE",
        occurredAt: daysAgo(9),
      },
      {
        decisionId: retinoid.id,
        userId,
        text: "Filled prescription and started 2x/week.",
        lifecycleSnapshot: "DECIDED",
        occurredAt: daysAgo(20),
      },
    ],
  });

  // 7) 身体时间线：全局事件与每条 decision 的事件使用同一日期脉络。
  // decisionId 只在该事件确实属于该决策时填写，供 Related Health Trend 使用。
  await prisma.timelineEvent.createMany({
    data: [
      {
        userId,
        decisionId: thermage.id,
        kind: "note",
        importance: "minor",
        title: "Logged jawline firmness baseline",
        detail: "Especially noticeable after poor sleep nights.",
        source: "you",
        occurredAt: daysAgo(45),
      },
      {
        userId,
        decisionId: thermage.id,
        kind: "decision",
        importance: "medium",
        title: "Considering Thermage",
        source: "you",
        occurredAt: daysAgo(40),
      },
      {
        userId,
        kind: "lab",
        importance: "medium",
        title: "LDL cholesterol improved to 128 mg/dL",
        detail: "Follow-up panel after nutrition changes.",
        source: "your doctor",
        occurredAt: daysAgo(60),
      },
      {
        userId,
        decisionId: retinoid.id,
        kind: "treatment",
        importance: "important",
        title: "Started tretinoin 0.025%",
        source: "you",
        occurredAt: daysAgo(20),
      },
      {
        userId,
        decisionId: thermage.id,
        kind: "note",
        importance: "minor",
        title: "Jawline firmness check-in",
        detail: "More noticeable after several short nights.",
        source: "you",
        occurredAt: daysAgo(21),
      },
      {
        userId,
        decisionId: hrt.id,
        kind: "decision",
        importance: "medium",
        title: "Started considering HRT",
        detail: "Sleep changes and clinician questions recorded.",
        source: "you",
        occurredAt: daysAgo(9),
      },
      {
        userId,
        kind: "photo",
        importance: "minor",
        title: "Front-facing skin photo",
        source: "you",
        occurredAt: daysAgo(14),
      },
      {
        userId,
        decisionId: thermage.id,
        kind: "outcome",
        importance: "important",
        title: "Thermage consultation completed",
        detail: "Clinician recommended a single session.",
        source: "your doctor",
        occurredAt: daysAgo(12),
      },
      {
        userId,
        decisionId: thermage.id,
        kind: "note",
        importance: "minor",
        title: "Jawline firmness stable this week",
        detail: "No treatment started; continuing weekly observation.",
        source: "you",
        occurredAt: daysAgo(7),
      },
      {
        userId,
        kind: "lab",
        importance: "important",
        title: "LDL cholesterol improved to 116 mg/dL",
        detail: "Latest follow-up panel.",
        source: "your doctor",
        occurredAt: daysAgo(7),
      },
      {
        userId,
        decisionId: retinoid.id,
        kind: "outcome",
        importance: "medium",
        title: "Increased tretinoin to three nights weekly",
        detail: "Mild dryness only; skin tolerance observation remains active.",
        source: "you",
        occurredAt: daysAgo(3),
      },
    ],
  });

  // 8) 信号（设备/化验）
  await prisma.signal.createMany({
    data: [
      {
        userId,
        label: "HRV (7-day avg)",
        value: "44",
        unit: "ms",
        source: "Apple Health",
        confidence: "observed",
        trend: "down",
        measuredAt: daysAgo(1),
      },
      {
        userId,
        label: "Resting heart rate",
        value: "58",
        unit: "bpm",
        source: "Apple Health",
        confidence: "observed",
        trend: "flat",
        measuredAt: daysAgo(1),
      },
      {
        userId,
        label: "Deep sleep",
        value: "62",
        unit: "min",
        source: "Oura Ring",
        confidence: "observed",
        trend: "down",
        measuredAt: daysAgo(1),
      },
      {
        userId,
        label: "Estradiol",
        value: "38",
        unit: "pg/mL",
        source: "Blood panel",
        confidence: "possible",
        trend: "down",
        measuredAt: daysAgo(30),
      },
      {
        userId,
        label: "Skin firmness index",
        value: "Moderate laxity",
        source: "DrRuby Skin Scan",
        confidence: "not-assessable",
        measuredAt: daysAgo(14),
      },
      {
        userId,
        label: "Skin temperature delta",
        value: "+0.3",
        unit: "°C",
        source: "Apple Health",
        confidence: "possible",
        trend: "up",
        measuredAt: daysAgo(2),
      },
    ],
  });

  // 9) 研究目录（全局表，按 name 去重补建）+ 用户入组
  const studySpecs = [
    {
      name: "Perimenopausal Skin & Sleep Cohort",
      description:
        "Tracking skin firmness and sleep architecture through perimenopause.",
      irbNumber: "IRB-2025-014",
      recruitmentStatus: "recruiting",
      fields: ["sleep", "hrv", "skin_scan", "hormone_panel"],
    },
    {
      name: "RF Tightening Longitudinal Study",
      description: "12-month outcomes after monopolar RF treatments.",
      irbNumber: "IRB-2025-031",
      recruitmentStatus: "recruiting",
      fields: ["skin_scan", "photos", "self_report"],
    },
    {
      name: "Topical Retinoid Response Panel",
      description: "Skin response to prescription retinoids by baseline.",
      irbNumber: "IRB-2024-098",
      recruitmentStatus: "closed",
      fields: ["skin_scan", "self_report"],
    },
  ];
  const studies: Record<string, string> = {};
  for (const spec of studySpecs) {
    const existing = await prisma.researchStudy.findFirst({
      where: { name: spec.name },
    });
    const row = existing
      ? await prisma.researchStudy.update({
          where: { id: existing.id },
          data: spec,
        })
      : await prisma.researchStudy.create({ data: spec });
    studies[spec.name] = row.id;
  }
  await prisma.studyEnrollment.createMany({
    data: [
      {
        studyId: studies["Perimenopausal Skin & Sleep Cohort"],
        userId,
        status: "enrolled",
        arm: "observational",
        consentGiven: true,
        consentAt: daysAgo(60),
      },
      {
        studyId: studies["RF Tightening Longitudinal Study"],
        userId,
        status: "invited",
        consentGiven: false,
      },
    ],
  });

  // 10) 隐私开关（三档；self 永开锁定）
  await prisma.consentSetting.createMany({
    data: [
      {
        userId,
        key: "self",
        title: "Personal insights",
        description:
          "Use my data to power my own insights and recommendations.",
        value: true,
        locked: true,
      },
      {
        userId,
        key: "deidentified_contribution",
        title: "De-identified contribution",
        description:
          "Contribute de-identified data to improve models for people like me.",
        value: true,
        locked: false,
      },
      {
        userId,
        key: "identified_research",
        title: "Identified research",
        description:
          "Allow identified participation in approved research studies.",
        value: false,
        locked: false,
      },
    ],
  });

  // 11) 身体洞察（首页 attention 卡 + aging velocity 指标）
  await prisma.bodyInsight.createMany({
    data: [
      {
        userId,
        kind: "attention",
        tag: "Sleep",
        title: "Deep sleep down 15% this month",
        body: "Your deep sleep dropped alongside a lower HRV trend. Worth watching.",
        accent: "amber",
      },
      {
        userId,
        kind: "attention",
        tag: "Hormones",
        title: "Estradiol trending lower",
        body: "Consistent with your perimenopausal baseline; may affect skin and sleep.",
        accent: "purple",
      },
      {
        userId,
        kind: "attention",
        tag: "Skin",
        title: "Lower-face laxity flagged",
        body: "Latest skin scan shows moderate laxity around the jawline.",
        accent: "red",
      },
      {
        userId,
        kind: "aging_velocity",
        title: "Skin firmness",
        label: "Skin firmness",
        value: "Slightly accelerated",
        caption: "vs. your 6-month baseline",
        tone: "amber",
      },
      {
        userId,
        kind: "aging_velocity",
        title: "Recovery (HRV)",
        label: "Recovery (HRV)",
        value: "On track",
        caption: "within expected range",
        tone: "green",
      },
      {
        userId,
        kind: "aging_velocity",
        title: "Sleep quality",
        label: "Sleep quality",
        value: "Needs attention",
        caption: "declining 3 months",
        tone: "amber",
      },
      {
        userId,
        kind: "aging_velocity",
        title: "Hormonal phase",
        label: "Hormonal phase",
        value: "Perimenopausal",
        caption: "affects multiple systems",
        tone: "purple",
      },
    ],
  });

  // 12) 皮肤扫描（最近一次）
  await prisma.skinScan.create({
    data: {
      userId,
      scannedAt: daysAgo(14),
      headline: "Overall stable, with mild lower-face laxity to watch.",
      zones: [
        { name: "Forehead", status: "good" },
        { name: "Cheeks", status: "good" },
        { name: "Jawline", status: "watch" },
        { name: "Under-eye", status: "watch" },
        { name: "Neck", status: "attention" },
      ],
    },
  });

  // 13) N-of-1 实验
  await prisma.experiment.createMany({
    data: [
      {
        userId,
        title: "Magnesium glycinate before bed",
        hypothesis: "Improves deep sleep minutes within 3 weeks.",
        status: "running",
        window: "3 weeks",
      },
      {
        userId,
        title: "Tretinoin 0.025% 3x/week",
        hypothesis: "Improves skin texture over 12 weeks.",
        status: "running",
        window: "12 weeks",
      },
      {
        userId,
        title: "Morning sunlight 10 min",
        hypothesis: "Stabilizes circadian rhythm and HRV.",
        status: "planned",
        window: "4 weeks",
      },
    ],
  });

  // 14) 激素层读数
  await prisma.hormoneReading.createMany({
    data: [
      {
        userId,
        marker: "Estradiol",
        value: "38 pg/mL",
        phase: "Follicular",
        note: "Lower than prior year",
        measuredAt: daysAgo(30),
      },
      {
        userId,
        marker: "FSH",
        value: "18 mIU/mL",
        phase: "Follicular",
        note: "",
        measuredAt: daysAgo(30),
      },
      {
        userId,
        marker: "Progesterone",
        value: "0.8 ng/mL",
        phase: "Luteal",
        note: "",
        measuredAt: daysAgo(30),
      },
      {
        userId,
        marker: "Cortisol (AM)",
        value: "14 µg/dL",
        phase: "Morning",
        note: "Within range",
        measuredAt: daysAgo(30),
      },
    ],
  });

  // 15) 数据贡献（opt-in）
  await prisma.contribution.createMany({
    data: [
      {
        userId,
        title: "Sleep & HRV trends",
        description:
          "De-identified nightly sleep and HRV for the perimenopausal cohort.",
        shared: true,
        sharedAt: daysAgo(60),
      },
      {
        userId,
        title: "Skin scan series",
        description: "De-identified skin scans for the RF tightening study.",
        shared: false,
      },
    ],
  });

  // 16) Longitudinal health records. Each metric has multiple points so the
  // My Health dialogs render actual trajectories rather than isolated values.
  const [weight120, weight90, weight60, weight30, weight7] = await Promise.all(
    [
      [120, 67.2],
      [90, 66.5],
      [60, 65.8],
      [30, 65.2],
      [7, 64.8],
    ].map(([ago, value]) =>
      createConfirmedRecord({
        kind: "vitals",
        metricCode: "body_weight",
        title: "Body weight",
        recordedAt: daysAgo(ago as number),
        parsedValues: { value, unit: "kg" },
      }),
    ),
  );
  const [bp120, bp60, bp7] = await Promise.all(
    [
      [120, 132, 86],
      [60, 126, 82],
      [7, 118, 76],
    ].map(([ago, systolic, diastolic]) =>
      createConfirmedRecord({
        kind: "vitals",
        metricCode: "blood_pressure",
        title: "Blood pressure",
        recordedAt: daysAgo(ago as number),
        parsedValues: { systolic, diastolic, unit: "mmHg" },
      }),
    ),
  );
  const [hr90, hr45, hr7] = await Promise.all(
    [
      [90, 72],
      [45, 66],
      [7, 61],
    ].map(([ago, value]) =>
      createConfirmedRecord({
        kind: "vitals",
        metricCode: "heart_rate",
        title: "Resting heart rate",
        recordedAt: daysAgo(ago as number),
        parsedValues: { value, unit: "bpm" },
        source: "wearable",
      }),
    ),
  );
  const [ldl120, ldl60, ldl7] = await Promise.all(
    [
      [120, 142],
      [60, 128],
      [7, 116],
    ].map(([ago, value]) =>
      createConfirmedRecord({
        kind: "lab",
        metricCode: "ldl_cholesterol",
        title: "LDL cholesterol",
        recordedAt: daysAgo(ago as number),
        parsedValues: { value, unit: "mg/dL" },
        source: "your doctor",
        documentClass: "Lab",
      }),
    ),
  );
  const [firmness45, firmness21, firmness7] = await Promise.all(
    [
      [45, 2, "Mild laxity in the morning"],
      [21, 3, "More noticeable after poor sleep"],
      [7, 2, "Stable with consistent sleep"],
    ].map(([ago, severity, note]) =>
      createConfirmedRecord({
        kind: "symptom",
        metricCode: "jawline_firmness",
        title: "Jawline firmness",
        recordedAt: daysAgo(ago as number),
        parsedValues: { severity, note },
      }),
    ),
  );
  const tretinoinStart = await createConfirmedRecord({
    kind: "treatment",
    metricCode: "tretinoin",
    title: "Tretinoin 0.025%",
    recordedAt: daysAgo(20),
    parsedValues: {
      dosage: "0.025%",
      frequency: "2 nights per week",
      status: "active",
    },
  });
  const tretinoinCurrent = await createConfirmedRecord({
    kind: "treatment",
    metricCode: "tretinoin",
    title: "Tretinoin 0.025%",
    recordedAt: daysAgo(3),
    parsedValues: {
      dosage: "0.025%",
      frequency: "3 nights per week",
      status: "active",
    },
  });

  // Explicit links distinguish decisions supported by a treatment/record from
  // decisions that remain exploratory. Retinoid has treatment records; the
  // Thermage observation link is added once its tracking plan exists below.
  await prisma.decisionHealthRecord.createMany({
    data: [
      {
        decisionId: retinoid.id,
        healthRecordId: tretinoinStart.id,
        connectedBy: "you",
        connectedAt: daysAgo(20),
      },
      {
        decisionId: retinoid.id,
        healthRecordId: tretinoinCurrent.id,
        connectedBy: "you",
        connectedAt: daysAgo(3),
      },
    ],
  });

  // Thermage and the retinoid decision each have observations; HRT has none.
  const jawlineObservation = await prisma.observation.create({
    data: {
      userId,
      decisionId: thermage.id,
      title: "Jawline firmness",
      cadence: "weekly",
      startedAt: daysAgo(45),
    },
  });
  const retinoidObservation = await prisma.observation.create({
    data: {
      userId,
      decisionId: retinoid.id,
      title: "Skin tolerance on tretinoin",
      cadence: "weekly",
      startedAt: daysAgo(20),
    },
  });
  // HealthRecord is the complete observation history. ObservationEntry is a
  // legacy table and deliberately receives no new seed data.
  await prisma.healthRecord.updateMany({
    where: { id: { in: [firmness45.id, firmness21.id, firmness7.id] } },
    data: { observationId: jawlineObservation.id },
  });
  await prisma.healthRecord.updateMany({
    where: { id: { in: [tretinoinStart.id, tretinoinCurrent.id] } },
    data: { observationId: retinoidObservation.id },
  });

  // The latest health record is the decision-facing tracking reference.
  await prisma.healthRecord.update({
    where: { id: firmness7.id },
    data: {
      parsedValues: {
        severity: 2,
        note: "Stable with consistent sleep",
        cadence: "weekly",
      },
    },
  });
  await prisma.decisionHealthRecord.create({
    data: {
      decisionId: thermage.id,
      healthRecordId: firmness7.id,
      connectedBy: "assistant",
      connectedAt: daysAgo(7),
    },
  });

  const bloodPanel = ldl60;
  await prisma.photo.createMany({
    data: [
      {
        userId,
        healthRecordId: bloodPanel.id,
        objectKey: "mock/photos/lab-scan-1.jpg",
        caption: "Lab report page 1",
        takenAt: daysAgo(30),
      },
      {
        userId,
        objectKey: "mock/photos/face-front-14d.jpg",
        caption: "Front-facing, week 0 of tretinoin",
        takenAt: daysAgo(14),
      },
    ],
  });

  // 17) 订阅
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      tier: "decision",
      status: "active",
      currentPeriodEnd: daysAgo(-20),
    },
    create: {
      userId,
      tier: "decision",
      status: "active",
      stripeCustomerId: "cus_mock_demo",
      stripeSubscriptionId: "sub_mock_demo",
      currentPeriodEnd: daysAgo(-20),
    },
  });

  // 18) 通知 + 待办
  await prisma.notification.createMany({
    data: [
      {
        userId,
        kind: "insight",
        title: "New insight: deep sleep is trending down",
        readAt: null,
        createdAt: daysAgo(2),
      },
      {
        userId,
        kind: "study",
        title: "You're invited to the RF Tightening study",
        readAt: null,
        createdAt: daysAgo(5),
      },
      {
        userId,
        kind: "decision",
        title: "Thermage consultation logged to your timeline",
        readAt: daysAgo(11),
        createdAt: daysAgo(12),
      },
    ],
  });
  await prisma.followUpTask.createMany({
    data: [
      {
        userId,
        decisionId: thermage.id,
        title: "Compare two clinic quotes before booking",
        dueAt: daysAgo(-5),
        status: "open",
      },
      {
        userId,
        decisionId: hrt.id,
        title: "Book clinician appointment to discuss HRT",
        dueAt: daysAgo(-10),
        status: "open",
      },
      {
        userId,
        title: "Take week-4 progress photo",
        dueAt: daysAgo(-14),
        status: "open",
      },
    ],
  });

  // 19) Library journeys（全局内容，固定 id upsert 保证幂等；禁 deleteMany 全清防抹真实数据）
  const journeys = [
    {
      id: "seed-journey-thermage",
      decisionType: "thermage",
      goal: "firmness",
      concern: "sagging jawline",
      timingContext: "postpartum",
      summary:
        "Noticed gradual tightening over 2–3 months; results were subtle, not dramatic.",
      outcome: "would_do_again",
      sourceType: "verified_member",
    },
    {
      id: "seed-journey-hrt-sleep",
      decisionType: "hrt",
      goal: "sleep-quality",
      concern: "night sweats",
      timingContext: "perimenopausal",
      summary:
        "Sleep improved within 3 weeks of starting HRT; skin changes came later and were milder.",
      outcome: "would_do_again",
      sourceType: "founder_interview",
    },
    {
      id: "seed-journey-tretinoin",
      decisionType: "skincare",
      goal: "even-tone",
      concern: "texture",
      timingContext: "anytime",
      summary:
        "Purge weeks 2–4 were rough, but tone evened out by month 3 on 0.025%.",
      outcome: "would_do_again",
      sourceType: "verified_member",
    },
    {
      id: "seed-journey-botox",
      decisionType: "botox",
      goal: "expression lines",
      concern: "forehead lines",
      timingContext: "mid-30s",
      summary:
        "Preventative approach; movement preserved, lines softened. Repeated every 4 months.",
      outcome: "mixed",
      sourceType: "partner_clinic",
    },
    {
      id: "seed-journey-laser",
      decisionType: "laser",
      goal: "pigmentation",
      concern: "melasma",
      timingContext: "summer",
      summary:
        "Two sessions helped pigmentation, but strict sun discipline was the real decider.",
      outcome: "mixed",
      sourceType: "research_study",
    },
    {
      id: "seed-journey-ultherapy",
      decisionType: "ultherapy",
      goal: "firmness",
      concern: "neck laxity",
      timingContext: "post-40",
      summary:
        "More discomfort than expected and slow results; visible lift at month 4.",
      outcome: "would_not_do_again",
      sourceType: "founder_interview",
    },
  ];
  for (const j of journeys) {
    await prisma.journey.upsert({ where: { id: j.id }, update: {}, create: j });
  }
  // living journey 的版本更新（journeyId_version 是普通索引非唯一，upsert where 必须用主键 id）
  const journeyUpdates = [
    {
      id: "seed-journey-thermage-u1",
      journeyId: "seed-journey-thermage",
      version: 1,
      note: "Month 3: fine lines around eyes look softer.",
      createdAt: daysAgo(90),
    },
    {
      id: "seed-journey-thermage-u2",
      journeyId: "seed-journey-thermage",
      version: 2,
      note: "Month 6: jawline firmness holding; would repeat.",
      createdAt: daysAgo(30),
    },
    {
      id: "seed-journey-tretinoin-u1",
      journeyId: "seed-journey-tretinoin",
      version: 1,
      note: "Week 4: purge settled, no new breakouts.",
      createdAt: daysAgo(60),
    },
  ];
  for (const u of journeyUpdates) {
    await prisma.journeyUpdate.upsert({
      where: { id: u.id },
      update: {},
      create: u,
    });
  }

  // --- 汇总 ---
  const counts = {
    decisions: await prisma.decision.count({ where: { userId } }),
    decisionEntries: await prisma.decisionEntry.count({ where: { userId } }),
    timeline: await prisma.timelineEvent.count({ where: { userId } }),
    signals: await prisma.signal.count({ where: { userId } }),
    studies: await prisma.researchStudy.count(),
    enrollments: await prisma.studyEnrollment.count({ where: { userId } }),
    consent: await prisma.consentSetting.count({ where: { userId } }),
    insights: await prisma.bodyInsight.count({ where: { userId } }),
    experiments: await prisma.experiment.count({ where: { userId } }),
    hormoneReadings: await prisma.hormoneReading.count({ where: { userId } }),
    contributions: await prisma.contribution.count({ where: { userId } }),
    healthRecords: await prisma.healthRecord.count({ where: { userId } }),
    photos: await prisma.photo.count({ where: { userId } }),
    wearableDaily: await prisma.wearableDaily.count({ where: { userId } }),
    notifications: await prisma.notification.count({ where: { userId } }),
    followUps: await prisma.followUpTask.count({ where: { userId } }),
    journeys: await prisma.journey.count(),
    journeyUpdates: await prisma.journeyUpdate.count(),
  };
  console.log("[seed] done. Row counts:");
  console.table(counts);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("[seed] failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
