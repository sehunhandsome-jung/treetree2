import { NavLink } from "react-router-dom";
import {
  House,
  Sprout,
  ScanLine,
  CalendarDays,
  Gift,
  UserRound,
} from "lucide-react";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/home" className="nav-item">
        <House size={20} strokeWidth={1.8} />
        <span>홈</span>
      </NavLink>

      <NavLink to="/garden" className="nav-item">
        <Sprout size={20} strokeWidth={1.8} />
        <span>내 정원</span>
      </NavLink>

      <NavLink to="/activity" className="nav-item">
        <ScanLine size={20} strokeWidth={1.8} />
        <span>활동인증</span>
      </NavLink>

      <NavLink to="/challenges" className="nav-item">
        <CalendarDays size={20} strokeWidth={1.8} />
        <span>챌린지</span>
      </NavLink>

      <NavLink to="/rewards" className="nav-item">
        <Gift size={20} strokeWidth={1.8} />
        <span>리워드</span>
      </NavLink>

      <NavLink to="/mypage" className="nav-item">
        <UserRound size={20} strokeWidth={1.8} />
        <span>마이페이지</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;