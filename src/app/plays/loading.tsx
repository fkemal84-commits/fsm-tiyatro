export default function Loading() {
  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-20">
        <div className="h-16 w-80 bg-white/5 rounded-2xl mx-auto animate-pulse mb-4"></div>
        <div className="h-5 w-96 bg-white/5 rounded-xl mx-auto animate-pulse"></div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-7xl mx-auto">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="glass-card h-[600px] animate-pulse opacity-40"></div>
        ))}
      </div>
    </div>
  );
}
