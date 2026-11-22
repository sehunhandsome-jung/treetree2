const DEV_MODE_STORAGE_KEY = "devMode";

/*
  Vite 개발 서버이거나, 주소에 ?dev=1을 붙여 연 적이 있는 기기면
  개발 모드다. (?dev=0으로 열면 해제)
  외부 체험용 빌드에서는 서버 전체 기록을 지우는 버튼처럼 위험한
  개발 기능을 숨기는 데 쓴다.
*/
export function getIsDevMode() {
  if (import.meta.env.DEV) {
    return true;
  }

  const flag = new URLSearchParams(
    window.location.search
  ).get("dev");

  if (flag === "1") {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, "true");
  } else if (flag === "0") {
    localStorage.removeItem(DEV_MODE_STORAGE_KEY);
  }

  return localStorage.getItem(DEV_MODE_STORAGE_KEY) === "true";
}
