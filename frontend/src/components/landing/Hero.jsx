import "./Hero.css";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-transparent"
    >
      {/* Ambient glow blobs */}
      <div className="hero-glow-left" aria-hidden="true" />
      <div className="hero-glow-right" aria-hidden="true" />

      <div className="pointer-events-none relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 pb-20 pt-24 text-center">

        {/* Badge */}
        <div className="animate-[rise_0.7s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] rounded-full border border-white/10 bg-white/[0.05] px-[15px] py-[7px] text-[12.5px] font-medium text-white/85 backdrop-blur-md">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-br from-[#5227FF] to-[#FF9FFC] shadow-[0_0_8px_rgba(255,159,252,0.7)]" />
          AI-powered data intelligence
        </div>

        {/* Headline & Tagline */}
        <h1 className="mt-6 max-w-[920px] animate-[rise_0.85s_cubic-bezier(0.16,1,0.3,1)_0.65s_both] font-extrabold leading-[1.06] tracking-[-0.03em]">
          <span className="brand-datamind text-[clamp(2.8rem,7vw,5.6rem)]">
            <span className="brand-data">Data</span>
            <span className="brand-mind">Mind</span>
          </span>
          <span className="mt-3.5 block text-[clamp(1.25rem,2.8vw,2.15rem)] font-semibold leading-[1.25] tracking-[-0.015em] bg-gradient-to-r from-white via-[#e9d8ff] via-45% to-[#ffc2fa] bg-clip-text text-transparent">
            Agentic Intelligence For Data Analysis
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-5 max-w-[540px] animate-[rise_0.8s_cubic-bezier(0.16,1,0.3,1)_0.82s_both] text-base font-normal leading-relaxed text-white/55 md:text-[1.1rem]">
          Upload any dataset, ask questions in plain English, and watch AI agents
          clean, visualize, and explain your data — in seconds.
        </p>

        {/* Capabilities pills */}
        <div className="hero-capabilities">
          <span>Upload your data</span>
          <i />
          <span>Ask in plain English</span>
          <i />
          <span>Get intelligent insights</span>
        </div>

        {/* Single explore CTA */}
        <div className="hero-cta-row pointer-events-auto">
          <button
            type="button"
            className="hero-cta-primary"
            onClick={() =>
              document.getElementById("features")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            Explore features
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>



        {/* Watermark */}
        <div className="mt-7 animate-[rise_0.8s_cubic-bezier(0.16,1,0.3,1)_1.1s_both] text-[11px] font-semibold uppercase tracking-[0.08em] text-white/30">
          DataMind Workspace
        </div>
      </div>
    </section>
  );
}