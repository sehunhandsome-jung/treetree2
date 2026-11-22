import { Construction } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import MobileLayout from "./MobileLayout";

/*
  마지막 글자의 받침 유무로 조사를 고른다.
  (회원가입 → "회원가입은", 아이디 찾기 → "아이디 찾기는")
*/
function withTopicParticle(word: string) {
  const lastCharacter = word.at(-1);

  if (!lastCharacter) {
    return word;
  }

  const code = lastCharacter.charCodeAt(0);
  const isHangulSyllable = code >= 0xac00 && code <= 0xd7a3;

  if (!isHangulSyllable) {
    return `${word}는`;
  }

  const hasFinalConsonant = (code - 0xac00) % 28 !== 0;

  return `${word}${hasFinalConsonant ? "은" : "는"}`;
}

function ComingSoon() {
  const navigate = useNavigate();
  const location = useLocation();

  const featureName = location.state?.featureName;

  return (
    <MobileLayout>
      <div className="coming-soon">
        <Construction size={52} strokeWidth={1.5} />

        <h1>
          {featureName
            ? `${withTopicParticle(featureName)} 준비중이에요`
            : "서비스 준비중이에요"}
        </h1>

        <p>
          더 좋은 기능으로 찾아올게요 🌱
        </p>

        <button
          type="button"
          className="coming-soon-back"
          onClick={() => navigate(-1)}
        >
          돌아가기
        </button>
      </div>
    </MobileLayout>
  );
}

export default ComingSoon;
