// Components
import Navigation from "./components/navbar/Navbar";
import LoginForm from "./components/loginForm/LoginForm";
import Footer from "./components/Footer/Footer";

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
