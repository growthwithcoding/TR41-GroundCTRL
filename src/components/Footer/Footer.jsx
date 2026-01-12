import { Container, Navbar } from "react-bootstrap";

import "./Footer.css";

function Footer() {
  return (
    <Container>
      <Navbar expand="lg" className="bg-body-tertiary footer" fixed="bottom">
        <Navbar.Brand className="footer-brand" href="#">
          &copy;Navbar
        </Navbar.Brand>
      </Navbar>
    </Container>
  );
}

export default Footer;
