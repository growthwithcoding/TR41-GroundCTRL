// Components
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Footer from "./components/Footer/Footer";
import Navbar from "./components/navbar/Navbar";
import LoginForm from "./components/loginForm/LoginForm";
import RegistrationForm from "./components/registrationForm/RegistrationForm";
import HomepageView from "./views/HomepageView/HomepageView";

// Style Sheets
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomepageView />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegistrationForm />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
