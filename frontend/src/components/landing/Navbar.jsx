import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="absolute left-0 right-0 top-0 z-30 flex justify-center px-4 pt-6">
      <div className="flex w-full max-w-[880px] items-center justify-between gap-7 rounded-full border border-white/10 bg-[#120e1a]/45 p-2 pl-5 shadow-2xl backdrop-blur-xl">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-white"
        >
          <span className="flex h-6 w-6 items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#5227FF" />
                  <stop offset="100%" stopColor="#FF9FFC" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L14.2 9.2L21 12L14.2 14.8L12 22L9.8 14.8L3 12L9.8 9.2L12 2Z"
                fill="url(#logoGrad)"
              />
            </svg>
          </span>
          DataMind
        </button>

        <div className="hidden items-center gap-7 md:flex">
          <a href="#features" className="text-sm font-medium text-white/60 transition hover:text-white">
            Features
          </a>
          <a href="#workflow" className="text-sm font-medium text-white/60 transition hover:text-white">
            WorkFlow
          </a>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/signin")}
            className="rounded-full px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            Sign in
          </button>

          <button
            onClick={() => navigate("/workspace")}
            className="rounded-full bg-white px-[18px] py-2 text-sm font-semibold text-[#0a0710] shadow-lg transition hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(255,159,252,0.28)]"
          >
            Get started
          </button>
        </div>
      </div>
    </nav>
  );
}
