import Navbar from './ui/Navbar.jsx';
import Footer from './ui/Footer.jsx';
import Home from './pages/Home.jsx';
import Clubs from './pages/Clubs.jsx';
import Leagues from './pages/Leagues.jsx';
import Favorites from './pages/Favorites.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import ClubDetail from './pages/ClubDetail.jsx';
import LeagueDetail from './pages/LeagueDetail.jsx';
import MatchSummary from './pages/MatchSummary.jsx';
import MatchPrediction from './pages/MatchPrediction.jsx';
import Admin from './pages/Admin.jsx';
import TeamList from './pages/TeamList.jsx';
import { Route, Routes, Outlet, Navigate } from 'react-router';
import { BrowserRouter } from 'react-router';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import { getAuthStatus, isAdminUser } from './helpers/auth.jsx';

// Protected Route Component untuk halaman yang memerlukan auth
function ProtectedRoute({ children }) {
  const { isLoggedIn } = getAuthStatus();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  return children;
}

// Admin Protected Route Component untuk halaman yang hanya bisa diakses admin
function AdminProtectedRoute({ children }) {
  const { isLoggedIn } = getAuthStatus();
  const isAdmin = isAdminUser();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
}

// Auth Redirect Component untuk mencegah user yang sudah login mengakses login/register
function AuthRedirectRoute({ children }) {
  const { isLoggedIn } = getAuthStatus();
  const isAdmin = isAdminUser();

  if (isLoggedIn) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<MainRoute />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function MainRoute() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/leagues" element={<Leagues />} />
        <Route
          path="/login"
          element={
            <AuthRedirectRoute>
              <Login />
            </AuthRedirectRoute>
          }
        />
        <Route
          path="/register"
          element={
            <AuthRedirectRoute>
              <Register />
            </AuthRedirectRoute>
          }
        />

        {/* Only Favorites and Profile require authentication */}
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <Admin />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <AdminProtectedRoute>
            <TeamList />
          </AdminProtectedRoute>
        }
      />
      <Route path="/leagues/:id" element={<LeagueDetail />} />
      <Route path="/teams/:id" element={<ClubDetail />} />
      <Route path="/matches/:matchId/summary" element={<MatchSummary />} />
      <Route path="/matches/:matchId/prediction" element={<MatchPrediction />} />
    </Routes>
  );
}

export default App;
