import { Navigate, Route, Routes } from "react-router-dom";
import { NotificationProvider } from "./context/NotificationContext";
import AppLayout from "./components/layout/AppLayout";
import Watchtower from "./pages/Watchtower";
import CelestialScroll from "./pages/CelestialScroll";
import SpiritLens from "./pages/SpiritLens";
import SkyViewRadar from "./components/features/skyview/SkyViewRadar";
import Login from "./pages/Login";

export default function App() {
  return (
    <NotificationProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/watchtower" replace />} />
          <Route path="watchtower" element={<Watchtower />} />
          <Route path="spirit-lens" element={<SpiritLens />} />
          <Route path="celestial-scroll" element={<CelestialScroll />} />
          <Route path="skyview-radar" element={<SkyViewRadar />} />
        </Route>

        <Route path="*" element={<Navigate to="/watchtower" replace />} />
      </Routes>
    </NotificationProvider>
  );
}