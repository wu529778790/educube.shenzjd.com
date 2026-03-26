import ToolCard from "@/components/ToolCard";
import { tools } from "@/data/tools";

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--edu-cream)" }}>
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--edu-navy)" }}
            >
              教
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base">教立方</span>
              <span className="text-slate-400 text-sm ml-1.5">EduCube</span>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#tools" className="hover:text-slate-800 transition-colors">
              教具库
            </a>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400">人教版四年级</span>
          </nav>
        </div>
      </header>

      {/* Hero 区域 */}
      <section className="relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
            style={{ background: "var(--edu-sky)" }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-8"
            style={{ background: "var(--edu-orange)" }}
          />
          {/* 几何网格 */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#1a3a5c"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              人教版四年级数学 · 3D 空间感知教具
            </div>

            <h1 className="text-4xl font-bold text-slate-800 leading-tight mb-4">
              让空间想象力
              <br />
              <span
                className="relative"
                style={{ color: "var(--edu-navy)" }}
              >
                看得见、摸得着
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  height="4"
                  viewBox="0 0 200 4"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 3 Q50 0 100 3 Q150 6 200 3"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              5 个精心制作的 3D 交互教具，专为课堂演示设计。
              <br />
              点击即用，无需安装，浏览器直接运行。
            </p>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🏫</span>
                <span>适合课堂大屏演示</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">📱</span>
                <span>支持平板操作</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">🆓</span>
                <span>完全免费</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 教具网格 */}
      <section id="tools" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800">3D 空间教具</h2>
            <p className="text-sm text-slate-400 mt-1">
              共 {tools.length} 个教具 · 点击进入全屏模式
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-white px-3 py-2 rounded-lg border border-slate-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            全屏后按 ESC 返回
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} />
          ))}
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--edu-navy)" }}
            >
              教
            </div>
            <span>教立方 EduCube</span>
          </div>
          <span>专为中小学数学老师设计的交互教具平台</span>
        </div>
      </footer>
    </div>
  );
}
