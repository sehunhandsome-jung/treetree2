import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Garden from "./pages/Garden";
import Activity from "./pages/Activity";
import ActivityComplete from "./pages/ActivityComplete";
import HarvestComplete from "./pages/HarvestComplete";
import Rewards from "./pages/Rewards";
import MyPage from "./pages/MyPage";
import Challenges from "./pages/Challenges";
import Corporate from "./pages/Corporate";
import ComingSoon from "./components/ComingSoon";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/garden" element={<Garden />} />
        <Route path="/activity" element={<Activity />} />
        <Route
          path="/activity-complete"
          element={<ActivityComplete />}
        />
        <Route
          path="/harvest-complete"
          element={<HarvestComplete />}
        />
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/corporate" element={<Corporate />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
