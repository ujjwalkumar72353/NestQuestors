import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import ChatWidget from "./components/ChatWidget";
import DemoBanner from "./components/DemoBanner";
import CompareTray from "./components/CompareTray";
import Footer from "./components/Footer";
import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import { loadSession } from "./store/userSlice";

const About = lazy(() => import("./pages/About"));
const Compare = lazy(() => import("./pages/Compare"));
const CreateListing = lazy(() => import("./pages/CreateListing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Insights = lazy(() => import("./pages/Insights"));
const Listing = lazy(() => import("./pages/Listing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const Saved = lazy(() => import("./pages/Saved"));
const Search = lazy(() => import("./pages/Search"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <DemoBanner />
        <Header />
        <main className="flex-1">
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/listing/:id" element={<Listing />} />
              <Route path="/about" element={<About />} />
              <Route path="/compare" element={<Compare />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
              <Route element={<PrivateRoute />}>
                <Route path="/saved" element={<Saved />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create-listing" element={<CreateListing />} />
                <Route path="/edit-listing/:id" element={<EditListing />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      <CompareTray />
      <ChatWidget />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--surface)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
