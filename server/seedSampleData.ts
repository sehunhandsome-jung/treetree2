/*
  기업용 ESG 리포트 시연을 위한 샘플 데이터 생성기.

  실행:
    npm run seed:sample           샘플 데이터 넣기
    npm run seed:sample -- --clear  샘플 데이터만 지우기

  규칙
  - 샘플 clientId는 전부 "sample-"로 시작한다. 지울 때 이 접두사만 보고
    골라내므로 실제 사용자 기록은 건드리지 않는다.
  - 난수는 고정 시드를 쓴다. 몇 번을 돌려도 같은 데이터가 나와서
    시연 화면의 숫자가 바뀌지 않는다.
  - 앱의 부정 사용 방지 규칙을 그대로 지킨다.
    활동은 (사람, 날짜, 활동 종류)당 1건, 챌린지는 (사람, 날짜)당 1건.
  - 서버는 시작할 때 data.json을 한 번만 읽는다. 넣은 뒤 반드시 재시작할 것.
*/
import fs from "node:fs";
import { randomUUID } from "node:crypto";

import { DATA_FILE } from "./dataPath.js";

const SAMPLE_PREFIX = "sample-";
const EMPLOYEE_COUNT = 48;
const DAYS = 90;

const dataFile = DATA_FILE;

type ActivityRecord = {
  id: string;
  clientId: string;
  activity: string;
  date: string;
  time: string;
  growthReward: number;
  pointReward: number;
  reason: string;
  createdAt: string;
};

type ChallengeRecord = {
  id: string;
  clientId: string;
  date: string;
  time: string;
  weekday: number;
  missionTitle: string;
  missionDescription?: string;
  pointReward: number;
  reason: string;
  createdAt: string;
};

type ServerData = {
  usedImageHashes: string[];
  dailyActivityClaims: string[];
  activityRecords: ActivityRecord[];
  challengeRecords: ChallengeRecord[];
  dailyChallengeClaims: string[];
};

/* mulberry32 — 짧고 고정 시드로 재현 가능한 난수. */
function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;

    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261117);

function pick<T>(items: readonly T[]) {
  return items[Math.floor(random() * items.length)];
}

/*
  활동별 보상은 server/index.ts의 activityRewards와 맞춰야 한다.
  둘이 어긋나면 리포트의 포인트 합계가 실제 지급과 달라진다.
*/
const ACTIVITY_SPECS = [
  {
    name: "텀블러 사용",
    growth: 5,
    points: 100,
    weight: 20,
    weekdayOnly: false,
    reasons: [
      "개인 텀블러에 음료를 받아 들고 있는 모습이 분명히 보입니다.",
      "카페 카운터에서 일회용 컵 대신 텀블러에 음료를 담고 있습니다.",
      "책상 위에 음료가 담긴 개인 텀블러를 두고 사용하는 모습입니다.",
    ],
  },
  {
    name: "대중교통 이용",
    growth: 6,
    points: 150,
    weight: 18,
    weekdayOnly: true,
    reasons: [
      "지하철 객차 안에서 이동 중인 모습이 분명히 보입니다.",
      "버스에 탑승해 좌석에 앉아 있는 장면이 확인됩니다.",
      "교통카드를 찍고 버스에 오르는 모습이 보입니다.",
    ],
  },
  {
    name: "분리배출",
    growth: 3,
    points: 80,
    weight: 16,
    weekdayOnly: false,
    reasons: [
      "재활용품을 종류별로 분류해 수거함에 넣고 있습니다.",
      "플라스틱 용기의 라벨을 떼어 분리 수거함에 넣는 모습입니다.",
      "종이와 플라스틱을 나눠 담아 배출하는 장면이 확인됩니다.",
    ],
  },
  {
    name: "장바구니 사용",
    growth: 5,
    points: 120,
    weight: 12,
    weekdayOnly: false,
    reasons: [
      "장을 본 물건을 에코백에 담아 들고 있는 모습입니다.",
      "일회용 봉투 대신 장바구니에 식료품을 담고 있습니다.",
      "계산대에서 개인 장바구니에 물건을 옮겨 담고 있습니다.",
    ],
  },
  {
    name: "자전거 이용",
    growth: 6,
    points: 150,
    weight: 9,
    weekdayOnly: true,
    reasons: [
      "자전거를 타고 도로를 주행하는 모습이 분명히 보입니다.",
      "공유 자전거에 올라 출발하려는 장면이 확인됩니다.",
      "헬멧을 쓰고 자전거를 타고 이동 중입니다.",
    ],
  },
  {
    name: "다회용 식기 사용",
    growth: 4,
    points: 100,
    weight: 10,
    weekdayOnly: true,
    reasons: [
      "일회용기 대신 여러 번 쓰는 그릇에 식사를 담아 먹고 있습니다.",
      "개인 수저와 다회용 그릇으로 점심을 먹는 모습입니다.",
      "사내 식당에서 다회용 식기를 사용하는 장면이 확인됩니다.",
    ],
  },
  {
    name: "리필 제품 이용",
    growth: 5,
    points: 120,
    weight: 5,
    weekdayOnly: false,
    reasons: [
      "리필 스테이션에서 기존 용기에 내용물을 채우고 있습니다.",
      "리필용 제품으로 쓰던 용기를 다시 채우는 모습입니다.",
      "세제를 리필 코너에서 소분해 담고 있습니다.",
    ],
  },
  {
    name: "플로깅 참여",
    growth: 8,
    points: 200,
    weight: 4,
    weekdayOnly: false,
    reasons: [
      "집게와 쓰레기봉투를 들고 야외에서 쓰레기를 줍고 있습니다.",
      "주운 쓰레기가 담긴 봉투를 들고 산책로를 걷는 모습입니다.",
      "하천변에서 쓰레기를 수거하는 장면이 확인됩니다.",
    ],
  },
  {
    name: "헌옷 기부",
    growth: 7,
    points: 180,
    weight: 3,
    weekdayOnly: false,
    reasons: [
      "의류수거함에 옷을 넣고 있는 모습이 분명히 보입니다.",
      "기부처 창구에 옷가지를 전달하는 장면이 확인됩니다.",
    ],
  },
  {
    name: "폐가전 재활용",
    growth: 7,
    points: 180,
    weight: 3,
    weekdayOnly: false,
    reasons: [
      "다 쓴 소형 가전을 폐가전 수거함에 배출하고 있습니다.",
      "수거 장소에 폐가전을 내려놓는 모습이 확인됩니다.",
    ],
  },
] as const;

const WEIGHTED_ACTIVITIES = ACTIVITY_SPECS.flatMap((spec) =>
  Array.from({ length: spec.weight }, () => spec)
);

const MISSIONS = [
  {
    title: "텀블러 챙기기",
    description: "출근길에 꼭 텀블러를 들고 나가기",
    reasons: [
      "개인 텀블러를 사용하는 모습이 미션 내용과 일치합니다.",
      "텀블러에 음료를 담아 들고 있어 미션을 수행한 것으로 보입니다.",
    ],
  },
  {
    title: "한 정거장 걷기",
    description: "퇴근할 때 한 정거장 미리 내려서 걷기",
    reasons: [
      "거리를 걷고 있는 모습이 확인되어 미션 수행으로 판단됩니다.",
      "보도를 따라 이동 중인 장면이 미션 내용과 맞습니다.",
    ],
  },
  {
    title: "분리수거 철저히",
    description: "라벨까지 떼어서 제대로 배출하기",
    reasons: [
      "라벨을 떼어 분류 배출하는 모습이 미션과 일치합니다.",
      "재활용품을 종류별로 나눠 버리는 장면이 확인됩니다.",
    ],
  },
  {
    title: "종이컵 안 쓰기",
    description: "사무실에서 하루 종일 종이컵 쓰지 않기",
    reasons: [
      "머그컵을 사용하는 모습이 미션 내용과 일치합니다.",
      "개인 컵으로 음료를 마시고 있어 미션을 수행했습니다.",
    ],
  },
  {
    title: "계단 이용하기",
    description: "엘리베이터 대신 계단으로 오르내리기",
    reasons: [
      "계단을 오르는 모습이 확인되어 미션 수행으로 판단됩니다.",
      "계단실에서 이동 중인 장면이 미션과 맞습니다.",
    ],
  },
  {
    title: "잔반 남기지 않기",
    description: "먹을 만큼만 담고 깨끗이 비우기",
    reasons: [
      "비워진 식판이 찍혀 있어 미션 수행으로 판단됩니다.",
      "음식을 남기지 않은 그릇이 확인됩니다.",
    ],
  },
] as const;

/* YYYY-MM-DD (한국 기준) */
function toKoreaDateString(date: Date) {
  return new Date(date.getTime() + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
}

function weekdayOf(dateString: string) {
  const [y, m, d] = dateString.split("-").map(Number);

  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function makeTime(fromHour: number, toHour: number) {
  const hour =
    fromHour +
    Math.floor(random() * (toHour - fromHour + 1));
  const minute = Math.floor(random() * 60);
  const second = Math.floor(random() * 60);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

/* 한국시각 문자열을 UTC ISO로. 저장 포맷이 UTC라서 9시간 뺀다. */
function toCreatedAt(date: string, time: string) {
  return new Date(
    Date.parse(`${date}T${time}+09:00`)
  ).toISOString();
}

function readData(): ServerData {
  /* 볼륨을 막 붙인 서버처럼 파일이 아직 없으면 빈 기록에서 시작한다. */
  if (!fs.existsSync(dataFile)) {
    return {
      usedImageHashes: [],
      dailyActivityClaims: [],
      activityRecords: [],
      challengeRecords: [],
      dailyChallengeClaims: [],
    };
  }

  const raw = fs.readFileSync(dataFile, "utf8");

  return JSON.parse(raw) as ServerData;
}

function writeData(data: ServerData) {
  fs.writeFileSync(
    dataFile,
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8"
  );
}

function removeSample(data: ServerData): ServerData {
  const isSample = (id: string) =>
    id.startsWith(SAMPLE_PREFIX);

  return {
    ...data,
    activityRecords: data.activityRecords.filter(
      (r) => !isSample(r.clientId)
    ),
    challengeRecords: data.challengeRecords.filter(
      (r) => !isSample(r.clientId)
    ),
    dailyActivityClaims: data.dailyActivityClaims.filter(
      (key) => !isSample(key)
    ),
    dailyChallengeClaims: data.dailyChallengeClaims.filter(
      (key) => !isSample(key)
    ),
  };
}

function seed(base: ServerData): ServerData {
  const activityRecords: ActivityRecord[] = [];
  const challengeRecords: ChallengeRecord[] = [];
  const activityClaims: string[] = [];
  const challengeClaims: string[] = [];

  const employees = Array.from(
    { length: EMPLOYEE_COUNT },
    (_, i) =>
      `${SAMPLE_PREFIX}emp-${String(i + 1).padStart(
        3,
        "0"
      )}`
  );

  /*
    사람마다 열심히 하는 정도가 다르다. 전원이 똑같이 참여하면
    1인당 평균 같은 지표가 현실감 없이 평평해진다.
  */
  const enthusiasm = employees.map(() => {
    const roll = random();

    if (roll < 0.2) return 0.05; /* 거의 안 함 */
    if (roll < 0.6) return 0.18; /* 가끔 */
    if (roll < 0.9) return 0.38; /* 꾸준히 */

    return 0.62; /* 열성 */
  });

  const today = new Date();

  for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = toKoreaDateString(
      new Date(today.getTime() - dayOffset * 86400000)
    );
    const weekday = weekdayOf(date);
    const isWeekend = weekday === 0 || weekday === 6;

    /*
      도입 초기에는 참여가 적고 점점 늘어나는 흐름을 만든다.
      리포트의 주별 추이가 밋밋하지 않도록.
    */
    const progress = (DAYS - dayOffset) / DAYS;
    const rampUp = 0.35 + 0.65 * progress;
    const weekendFactor = isWeekend ? 0.45 : 1;

    employees.forEach((clientId, index) => {
      const baseChance =
        enthusiasm[index] * rampUp * weekendFactor;

      /* 활동 인증 — 하루 최대 2종류까지 */
      const usedToday = new Set<string>();
      const tries = random() < 0.25 ? 2 : 1;

      for (let t = 0; t < tries; t += 1) {
        if (random() > baseChance) {
          continue;
        }

        const spec = pick(WEIGHTED_ACTIVITIES);

        if (usedToday.has(spec.name)) {
          continue;
        }

        if (spec.weekdayOnly && isWeekend) {
          continue;
        }

        usedToday.add(spec.name);

        const time = makeTime(7, 21);

        activityRecords.push({
          id: randomUUID(),
          clientId,
          activity: spec.name,
          date,
          time,
          growthReward: spec.growth,
          pointReward: spec.points,
          reason: pick(spec.reasons),
          createdAt: toCreatedAt(date, time),
        });

        activityClaims.push(
          `${clientId}:${date}:${spec.name}`
        );
      }

      /* 요일별 챌린지 — 하루 1건 */
      if (random() < baseChance * 0.5) {
        const mission = pick(MISSIONS);
        const time = makeTime(8, 22);

        challengeRecords.push({
          id: randomUUID(),
          clientId,
          date,
          time,
          weekday,
          missionTitle: mission.title,
          missionDescription: mission.description,
          pointReward: 50,
          reason: pick(mission.reasons),
          createdAt: toCreatedAt(date, time),
        });

        challengeClaims.push(`${clientId}:${date}`);
      }
    });
  }

  return {
    ...base,
    activityRecords: [
      ...base.activityRecords,
      ...activityRecords,
    ],
    challengeRecords: [
      ...base.challengeRecords,
      ...challengeRecords,
    ],
    dailyActivityClaims: [
      ...base.dailyActivityClaims,
      ...activityClaims,
    ],
    dailyChallengeClaims: [
      ...base.dailyChallengeClaims,
      ...challengeClaims,
    ],
  };
}

/*
  --auto: 배포 서버가 시작할 때(npm start) 부르는 모드.
  SEED_SAMPLE_DATA=1이고 데이터 파일이 아직 없을 때(= 처음 띄운 서버)만
  샘플을 넣는다. 이미 기록이 있으면 아무것도 하지 않으므로 재시작·재배포할
  때마다 샘플이 다시 들어가거나 실제 기록을 건드리는 일은 없다.
*/
if (process.argv.includes("--auto")) {
  if (process.env.SEED_SAMPLE_DATA !== "1") {
    process.exit(0);
  }

  if (fs.existsSync(dataFile)) {
    console.log(
      "데이터 파일이 이미 있어 샘플 데이터를 넣지 않습니다."
    );
    process.exit(0);
  }
}

const shouldClear = process.argv.includes("--clear");
const before = readData();
const cleaned = removeSample(before);

const removedActivities =
  before.activityRecords.length -
  cleaned.activityRecords.length;
const removedChallenges =
  before.challengeRecords.length -
  cleaned.challengeRecords.length;

if (removedActivities + removedChallenges > 0) {
  console.log(
    `기존 샘플 제거: 활동 ${removedActivities}건, 챌린지 ${removedChallenges}건`
  );
}

if (shouldClear) {
  writeData(cleaned);

  console.log(
    `샘플 데이터를 지웠습니다. 남은 실제 기록 — 활동 ${cleaned.activityRecords.length}건, 챌린지 ${cleaned.challengeRecords.length}건`
  );
} else {
  const next = seed(cleaned);
  const addedActivities =
    next.activityRecords.length -
    cleaned.activityRecords.length;
  const addedChallenges =
    next.challengeRecords.length -
    cleaned.challengeRecords.length;
  const people = new Set(
    [...next.activityRecords, ...next.challengeRecords]
      .map((r) => r.clientId)
      .filter((id) => id.startsWith(SAMPLE_PREFIX))
  );

  writeData(next);

  console.log(
    `샘플 데이터를 넣었습니다. 가상 임직원 ${people.size}명, 활동 ${addedActivities}건, 챌린지 ${addedChallenges}건 (최근 ${DAYS}일)`
  );
  console.log(
    `실제 기록은 그대로입니다 — 활동 ${cleaned.activityRecords.length}건, 챌린지 ${cleaned.challengeRecords.length}건`
  );
}

/* --auto는 서버 시작 직전에 돌기 때문에 재시작 안내가 필요 없다. */
if (!process.argv.includes("--auto")) {
  console.log("서버를 재시작해야 반영됩니다.");
}
