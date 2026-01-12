// Bootstrap Components
import { Card } from "react-bootstrap";

// Stylesheets
import "./Intro.css";

function Intro() {
  return (
    <Card className="intro-card">
      <Card.Body>
        <Card.Title>Welcome Future Pilots</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle>
        <Card.Text>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default Intro;
