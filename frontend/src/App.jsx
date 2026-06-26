import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import PublicFeedback from './pages/PublicFeedback';
import Dashboard from './pages/Dashboard';
import Enquiries from './pages/Enquiries';
import FollowUps from './pages/FollowUps';
import Rooms from './pages/Rooms';
import Availability from './pages/Availability';
import Bookings from './pages/Bookings';
import SelfCheckins from './pages/SelfCheckins';
import RoomService from './pages/RoomService';
import Housekeeping from './pages/Housekeeping';
import Feedback from './pages/Feedback';
import Complaints from './pages/Complaints';
import Corporate from './pages/Corporate';
import Groups from './pages/Groups';
import Guests from './pages/Guests';
import Handovers from './pages/Handovers';
import Payments from './pages/Payments';
import Pricing from './pages/Pricing';
import Reports from './pages/Reports';
import Users from './pages/Users';

const page = (el) => <ProtectedRoute><Layout>{el}</Layout></ProtectedRoute>;
const roled = (el, roles) => <ProtectedRoute roles={roles}><Layout>{el}</Layout></ProtectedRoute>;

export default function App() {
  const { ready } = useAuth();
  if (!ready) return null;
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/feedback/:bookingId" element={<PublicFeedback />} />
      <Route path="/" element={page(<Dashboard />)} />
      <Route path="/enquiries" element={page(<Enquiries />)} />
      <Route path="/follow-ups" element={page(<FollowUps />)} />
      <Route path="/rooms" element={page(<Rooms />)} />
      <Route path="/availability" element={page(<Availability />)} />
      <Route path="/bookings" element={page(<Bookings />)} />
      <Route path="/self-checkins" element={page(<SelfCheckins />)} />
      <Route path="/room-service" element={page(<RoomService />)} />
      <Route path="/housekeeping" element={page(<Housekeeping />)} />
      <Route path="/feedback" element={page(<Feedback />)} />
      <Route path="/complaints" element={page(<Complaints />)} />
      <Route path="/corporate" element={roled(<Corporate />, ['admin','manager','corporate_coordinator'])} />
      <Route path="/groups" element={roled(<Groups />, ['admin','manager','corporate_coordinator'])} />
      <Route path="/guests" element={page(<Guests />)} />
      <Route path="/handovers" element={page(<Handovers />)} />
      <Route path="/payments" element={roled(<Payments />, ['admin','manager','accounts','front_desk'])} />
      <Route path="/pricing" element={roled(<Pricing />, ['admin','manager'])} />
      <Route path="/reports" element={roled(<Reports />, ['admin','manager','accounts'])} />
      <Route path="/users" element={roled(<Users />, ['admin'])} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
