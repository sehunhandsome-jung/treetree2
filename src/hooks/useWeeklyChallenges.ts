import { useCallback, useRef, useState } from "react";

import {
  loadWeeklyChallenges,
  saveWeeklyChallenges,
  type WeeklyChallenge,
  type WeeklyChallengeMap,
} from "../utils/weeklyChallenges";

export function useWeeklyChallenges() {
  const [challenges, setChallenges] =
    useState<WeeklyChallengeMap>(loadWeeklyChallenges);

  /*
    저장은 setState 업데이터 안에서 하면 안 된다.
    업데이터는 호출 즉시가 아니라 렌더 중에 실행되고
    StrictMode에서는 두 번 호출되기 때문에,
    성공 여부를 동기적으로 돌려줄 수 없고 저장도 중복된다.
    그래서 최신 값을 ref로 들고 있다가 바깥에서 저장한다.
  */
  const challengesRef = useRef(challenges);

  const commit = useCallback(
    (next: WeeklyChallengeMap) => {
      if (!saveWeeklyChallenges(next)) {
        return false;
      }

      challengesRef.current = next;
      setChallenges(next);

      return true;
    },
    []
  );

  const upsertChallenge = useCallback(
    (
      weekday: number,
      title: string,
      description?: string
    ) =>
      commit({
        ...challengesRef.current,
        [weekday]: {
          weekday,
          title,
          description,
          updatedAt: new Date().toISOString(),
        },
      }),
    [commit]
  );

  const removeChallenge = useCallback(
    (weekday: number) => {
      const next = { ...challengesRef.current };

      delete next[weekday];

      return commit(next);
    },
    [commit]
  );

  const getChallenge = useCallback(
    (weekday: number): WeeklyChallenge | undefined =>
      challenges[weekday],
    [challenges]
  );

  return {
    challenges,
    upsertChallenge,
    removeChallenge,
    getChallenge,
  };
}
