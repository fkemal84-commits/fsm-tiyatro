export default function Loading() {
  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-16">
        <div className="h-12 w-64 bg-white/5 rounded-2xl mx-auto animate-pulse mb-4"></div>
        <div className="h-4 w-48 bg-white/5 rounded-xl mx-auto animate-pulse italic"></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="glass-card h-96 animate-pulse opacity-50"></div>
        <div className="glass-card h-96 animate-pulse opacity-50"></div>
      </div>
    </div>
  );
}
