export default function PageLayout({
  children,
  className = ""
}) {
  return (
    <div className={`space-y-8 ${className}`}>
      {children}
    </div>
  );
}
