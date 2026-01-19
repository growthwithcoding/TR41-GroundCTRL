import Intro from "../../components/intro/Intro";
import RegistrationForm from "../../components/registrationForm/RegistrationForm";
import "./HomepageView.css";
import LoginForm from "../../components/loginForm/LoginForm";
import { useAuth } from "../../contexts/AuthContext";

function HomepageView() {
  return (
    <div className="homepage-view">
      <Intro />
      <RegistrationForm submitFunction={} />
      <LoginForm />
    </div>
  );
}

export default HomepageView;
