import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/*
  인증 기록을 저장하는 JSON 파일 위치.

  - 기본값은 server/data.json (로컬 개발).
  - 클라우드에 올릴 때는 재배포해도 지워지지 않는 볼륨 경로를
    .env나 호스팅 설정의 DATA_FILE로 지정한다. 예) /data/data.json
    코드 폴더는 배포할 때마다 새로 만들어지므로 거기 두면 기록이 날아간다.

  서버(index.ts)와 샘플 데이터 생성기(seedSampleData.ts)가 같은 파일을
  봐야 하므로 이 모듈 하나에서만 정한다.
*/
export const DATA_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : fileURLToPath(new URL("./data.json", import.meta.url));

/* 볼륨을 막 붙였을 때는 폴더가 없을 수 있다. */
fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
