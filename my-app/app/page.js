"use client";
import { useState, useRef } from "react";

const INITIAL = { file: null, loading: false, error: null, result: null };

export default function EarningsCallResearchTool() {
  const [s, set] = useState(INITIAL);
  const inputRef = useRef(null);
  const [analysis, setAnalysis] = useState(null)

  const setFile = (file) => {
    if (!file) return;
    if (!["application/pdf", "text/plain"].includes(file.type))
      return set((p) => ({ ...p, error: "Only PDF or TXT files accepted.", file: null }));
    set((p) => ({ ...p, file, error: null, result: null }))
    console.log(s);
  };



  const run = async () => {
    if (!s.file) return set((p) => ({ ...p, error: "Upload a file first." }));
    set((p) => ({ ...p, loading: true, error: null, result: null }));
    try {
      const form = new FormData();
      form.append("file", s.file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `Error ${res.status}`);
      const data = await res.json();
      set((p) => ({ ...p, result: data, loading: false }));
    } catch (e) { set((p) => ({ ...p, error: e.message, loading: false })); }
  };

  const reset = () => { set(INITIAL); inputRef.current && (inputRef.current.value = ""); };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="w-2 h-2 bg-blue-600 rounded-full" />
              <span className="text-xs font-semibold tracking-widest text-blue-600 uppercase">Research Intelligence</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Earnings Call Research Tool</h1>
          </div>
          <span className="text-xs text-gray-400 border border-gray-200 rounded px-2.5 py-1 bg-gray-50">Analyst Edition</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Upload */}
        <section className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Document Upload</h2>
          <p className="text-sm text-gray-400 mb-5">Supports PDF and TXT earnings call transcripts</p>
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 cursor-pointer transition-colors
              ${s.file ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300"}`}
          >
            <input ref={inputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
            {s.file ? (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl">📄</div>
                <p className="font-semibold text-sm text-gray-800">{s.file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(s.file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xl">⬆️</div>
                <p className="text-sm font-medium text-gray-500">Drop your file here or <span className="text-blue-600 underline">browse</span></p>
                <p className="text-xs text-gray-400 mt-1">PDF or TXT only</p>
              </div>
            )}
          </div>
          {s.error && (
            <div className="mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
              <span className="text-red-500 mt-0.5">⚠</span>
              <p className="text-sm font-medium">{s.error}</p>
            </div>
          )}
          <div className="mt-6 flex items-center gap-3">
            <button onClick={run} disabled={s.loading || !s.file}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
              {s.loading ? <><Spin /> Analyzing…</> : <>🔬 Run Analysis</>}
            </button>
            {(s.file || s.result) && <button onClick={reset} disabled={s.loading} className="text-sm text-gray-400 hover:text-gray-600 font-medium">Reset</button>}
          </div>
        </section>

        {s.result && <Results r={s.result} />}
      </main>
    </div>
  );
}



function Results({ r }) {
  const [fmt, setFmt] = useState("txt");

  const handleDownload = () => {
    if (fmt === "json") return downloadJSON();
    downloadAnalysis();
  };
  const downloadAnalysis = () => {
    const content = `
  EARNINGS CALL ANALYSIS REPORT
  ==============================
  
  MANAGEMENT TONE
  ${r.management_tone}
  
  CONFIDENCE LEVEL
  ${r.confidence_level}
  
  KEY POSITIVES
  ${r.key_positives?.map((item, i) => `  ${i + 1}. ${item}`).join("\n")}
  
  KEY CONCERNS
  ${r.key_concerns?.map((item, i) => `  ${i + 1}. ${item}`).join("\n")}
  
  FORWARD GUIDANCE
  ${r.forward_guidance}
  
  CAPACITY UTILIZATION TREND
  ${r.capacity_utilization_trend}
  
  NEW GROWTH INITIATIVES
  ${r.new_growth_initiatives?.map((item, i) => `  ${i + 1}. ${item}`).join("\n")}
  
  ==============================
  Generated: ${new Date().toLocaleString()}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.company_name}-${r.quarter}-earnings-analysis.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadJSON = () => {
    const blob = new Blob(
      [JSON.stringify(r, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.company_name}-${r.quarter}-earnings-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cc = r.confidence_level?.toLowerCase().includes("high") ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : r.confidence_level?.toLowerCase().includes("low") ? "text-red-700 bg-red-50 border-red-200"
      : "text-amber-700 bg-amber-50 border-amber-200";
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3"><span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Analysis Results</span><div className="flex-1 h-px bg-gray-200" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Management Tone</p><p className="text-lg font-bold">{r.management_tone || "—"}</p></div>
        <div className={`rounded-xl border p-5 shadow-sm ${cc}`}><p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Confidence Level</p><p className="text-lg font-bold">{r.confidence_level || "—"}</p></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <BulletCard title="Key Positives" items={r.key_positives} color="green" />
        <BulletCard title="Key Concerns" items={r.key_concerns} color="red" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <InfoBlock title="Forward Guidance" value={r.forward_guidance} icon="📈" />
        <InfoBlock title="Capacity Utilization Trend" value={r.capacity_utilization_trend} icon="⚙️" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4"><span>🚀</span><h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">New Growth Initiatives</h3></div>
        {r.new_growth_initiatives?.length > 0 ? (
          <ol className="space-y-2.5">{r.new_growth_initiatives.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
            </li>))}</ol>
        ) : <p className="text-sm text-gray-400 italic">None identified.</p>}
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <select
          value={fmt}
          onChange={(e) => setFmt(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="txt">📄 Text Report (.txt)</option>
          <option value="json">🗂 Raw JSON (.json)</option>
        </select>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          ⬇️ Download Analysis
        </button>
      </div>
    </div>
  );
}

function BulletCard({ title, items, color }) {
  const s = { green: { h: "text-emerald-700", dot: "bg-emerald-500", b: "bg-emerald-100 text-emerald-700" }, red: { h: "text-red-700", dot: "bg-red-500", b: "bg-red-100 text-red-700" } }[color];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-5 h-5 rounded-full ${s.b} flex items-center justify-center text-xs font-bold leading-none`}>{color === "green" ? "+" : "−"}</span>
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${s.h}`}>{title}</h3>
      </div>
      {items?.length > 0 ? <ul className="space-y-2.5">{items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
          <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
        </li>))}</ul> : <p className="text-sm text-gray-400 italic">None identified.</p>}
    </div>
  );
}

function InfoBlock({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2"><span>{icon}</span><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p></div>
      <p className="text-sm text-gray-700 leading-relaxed">{value || "—"}</p>
    </div>
  );
}

function Spin() {
  return <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>;
}