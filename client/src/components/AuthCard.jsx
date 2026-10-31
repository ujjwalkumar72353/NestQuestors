function AuthCard({ title, subtitle, children }) {
  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted mt-1 mb-6">{subtitle}</p>
      <div className="card p-6">{children}</div>
    </div>
  );
}

export default AuthCard;
