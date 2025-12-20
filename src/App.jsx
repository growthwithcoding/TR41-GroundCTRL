// Components
import Navigation from "./components/navbar/Navbar";
import Login from "./components/login/Login";
import Footer from "./components/Footer/Footer";

// Style Sheets
import "./App.css";

function App() {
  return (
    <>
      <div>
        <Navigation />
        <Login />
        <Footer />
      </div>
    </>
  );
}

export default App;
