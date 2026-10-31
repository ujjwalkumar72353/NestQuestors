import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-muted mt-2 mb-5">This page doesn't exist or has moved.</p>
      <Link to="/" className="btn-primary">Back to home</Link>
    </div>
  );
}

export default NotFound;
