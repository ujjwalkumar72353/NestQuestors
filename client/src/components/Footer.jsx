import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-line mt-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col sm:flex-row justify-between gap-3 text-sm text-muted">
        <p>NestQuestors. Homes for bachelors across India.</p>
        <div className="flex gap-5">
          <Link to="/search" className="hover:text-ink">Explore</Link>
          <Link to="/insights" className="hover:text-ink">Rent insights</Link>
          <Link to="/about" className="hover:text-ink">About</Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
