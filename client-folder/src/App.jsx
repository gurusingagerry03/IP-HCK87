import { AuthProvider } from './ui/AuthContext.jsx';
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
import ApiTest from './components/ApiTest.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Route, Routes, Outlet } from 'react-router';
import { BrowserRouter } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<MainRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

function MainLayout() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

function MainRoute() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/leagues" element={<Leagues />} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/test" element={<ApiTest />} />
      </Route>
      <Route path="/leagues/:id" element={<LeagueDetail />} />
      <Route path="/teams/:id" element={<ClubDetail />} />
      <Route path="/matches/:matchId/summary" element={<MatchSummary />} />
      <Route path="/matches/:matchId/prediction" element={<MatchPrediction />} />
    </Routes>
  );
}

export default App;
