// Components
import Intro from "./components/intro/Intro";
import Footer from "./Components/Footer/Footer";
import Navigation from "./components/navbar/Navbar";
import LoginForm from "./components/loginForm/LoginForm";

// Style Sheets
import "./App.css";

function App() {
  return (
    <>
      <div>
        <Navigation />
        <LoginForm />
        <Footer />
      </div>
    </>
  );
}

export default App;
