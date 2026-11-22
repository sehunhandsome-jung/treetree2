import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import MobileLayout from "../components/MobileLayout";
import {
  AppleIcon,
  GoogleIcon,
  KakaoIcon,
  NaverIcon,
} from "../components/SocialIcons";

function Login() {
  const navigate = useNavigate();

  const [isPasswordVisible, setIsPasswordVisible] =
    useState(false);

  const [socialMessage, setSocialMessage] = useState<
    string | null
  >(null);

  const handleLogin = () => {
    navigate("/home");
  };

  /*
    회원가입·아이디 찾기처럼 별도 화면이 필요한 기능은
    준비중 페이지로 보낸다.
  */
  const goToComingSoon = (featureName: string) => {
    navigate("/coming-soon", {
      state: { featureName },
    });
  };

  /*
    SNS 로그인은 로그인 화면을 벗어나지 않는 편이 자연스러워
    같은 자리에서 안내만 보여준다.
  */
  const notifySocialComingSoon = (
    providerName: string
  ) => {
    setSocialMessage(
      `${providerName} 로그인은 준비 중이에요.`
    );
  };

  return (
    <MobileLayout>
      <div className="login-page">
        <div className="login-logo">
          <div className="login-logo-icon">🌿</div>
          <div className="login-logo-text">나 무 나 무</div>
        </div>

        <div className="login-form">
          <p className="login-demo-notice">
            체험판이에요. 아이디·비밀번호 없이
            <br />
            <strong>로그인하기</strong>를 눌러 시작해주세요.
          </p>

          <input
            type="text"
            placeholder="이메일 또는 아이디"
            className="login-input"
          />

          <div className="password-box">
            <input
              type={
                isPasswordVisible ? "text" : "password"
              }
              placeholder="비밀번호"
              className="login-input password-input"
            />

            <button
              type="button"
              className="password-eye"
              aria-label={
                isPasswordVisible
                  ? "비밀번호 숨기기"
                  : "비밀번호 보기"
              }
              aria-pressed={isPasswordVisible}
              onClick={() =>
                setIsPasswordVisible(
                  (visible) => !visible
                )
              }
            >
              {isPasswordVisible ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          <label className="login-keep">
            <input type="checkbox" />
            <span>로그인 상태 유지</span>
          </label>

          <button
            className="login-button"
            onClick={handleLogin}
          >
            로그인하기
          </button>

          <div className="login-links">
            <button
              type="button"
              onClick={() => goToComingSoon("아이디 찾기")}
            >
              아이디 찾기
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() =>
                goToComingSoon("비밀번호 찾기")
              }
            >
              비밀번호 찾기
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={() => goToComingSoon("회원가입")}
            >
              회원가입
            </button>
          </div>

          <div className="social-divider">
            <span />
            <p>SNS 계정으로 로그인</p>
            <span />
          </div>

          <div className="social-buttons">
            <button
              type="button"
              className="social kakao"
              aria-label="카카오로 로그인"
              onClick={() =>
                notifySocialComingSoon("카카오")
              }
            >
              <KakaoIcon />
            </button>
            <button
              type="button"
              className="social google"
              aria-label="구글로 로그인"
              onClick={() =>
                notifySocialComingSoon("구글")
              }
            >
              <GoogleIcon />
            </button>
            <button
              type="button"
              className="social naver"
              aria-label="네이버로 로그인"
              onClick={() =>
                notifySocialComingSoon("네이버")
              }
            >
              <NaverIcon />
            </button>
            <button
              type="button"
              className="social apple"
              aria-label="애플로 로그인"
              onClick={() =>
                notifySocialComingSoon("애플")
              }
            >
              <AppleIcon />
            </button>
          </div>

          {socialMessage && (
            <p
              className="login-social-message"
              role="status"
              aria-live="polite"
            >
              {socialMessage}
            </p>
          )}

          {/* 기업 담당자는 임직원 앱이 아니라 리포트 화면으로 간다. */}
          <button
            type="button"
            className="login-corporate-link"
            onClick={() => navigate("/corporate")}
          >
            기업 담당자로 로그인
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

export default Login;