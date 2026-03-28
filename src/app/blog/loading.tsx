export default function Loading() {
  return (
    <div className="pt-32 pb-16 px-[5%] min-h-screen bg-[var(--bg-dark)]">
      <header className="text-center mb-20 text-white">
        <div className="h-16 w-80 bg-white/5 rounded-2xl mx-auto animate-pulse mb-4"></div>
        <div className="h-5 w-96 bg-white/5 rounded-xl mx-auto animate-pulse"></div>
      </header>

      <div className="max-w-[1000px] mx-auto flex flex-col gap-16">
        {[1, 2, 3].map(i => (
          <div key={i} className="glass-card h-80 animate-pulse opacity-40"></div>
        ))}
      </div>
    </div>
  );
}
