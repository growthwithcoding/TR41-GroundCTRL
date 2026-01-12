// Components
import Navigation from "./components/Navbar/Navigation";
import Intro from "./components/intro/Intro";
import Footer from "./Components/Footer/Footer";

// Style Sheets
import "./App.css";

function App() {
  return (
    <>
      <div>
        <Navigation />
        <Intro />
        <Footer />
      </div>
    </>
  );
}

export default App;
