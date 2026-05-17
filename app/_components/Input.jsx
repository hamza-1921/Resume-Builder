'use client';
import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function AIResumeBuilder() {
  const resumeRef = useRef(null);
  const [userInfo, setUserInfo] = useState('');
  const [base64Image, setBase64Image] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // MANUAL LAYOUT STATE CONTROL
  const [selectedLayout, setSelectedLayout] = useState('classic'); // 'classic' | 'sidebar' | 'modern_grid'

  const [resumeData, setResumeData] = useState({
    fullName: 'YOUR NAME',
    primaryColor: '#0f172a',
    textColor: '#334155',
    accentColor: '#64748b',
    fontStyle: 'sans',
    summary: 'Paste your career overview details and upload an image to extract its exact color system...',
    sections: []
  });

  const compressImage = (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 450; 
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.5)); 
      };
    });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => setBase64Image(reader.result);
    if (file) reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!base64Image || !userInfo) return alert("Missing data or style image!");
    setLoading(true);
    try {
      const smallImg = await compressImage(base64Image);
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: smallImg, userText: userInfo }),
      });
      const rawData = await res.json();
      if (rawData.error) throw new Error(rawData.error);
      setResumeData(rawData);
    } catch (err) {
      alert("System processing error. Re-syncing connection.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = resumeRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${resumeData.fullName.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] p-6 lg:p-12 ${resumeData.fontStyle === 'serif' ? 'font-serif' : 'font-sans'}`}>
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[400px_1fr] gap-12">
        
        {/* INPUTS SIDEBAR */}
        <aside className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-2xl font-black tracking-tighter">STUDIO<span className="text-blue-600">.</span>AI</h2>
            
            {/* MANUAL FEATURE: LAYOUT SELECTOR CONTROL */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider">Choose Structural Layout</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-xl">
                <button 
                  onClick={() => setSelectedLayout('classic')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${selectedLayout === 'classic' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Classic
                </button>
                <button 
                  onClick={() => setSelectedLayout('sidebar')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${selectedLayout === 'sidebar' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Sidebar
                </button>
                <button 
                  onClick={() => setSelectedLayout('modern_grid')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${selectedLayout === 'modern_grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Grid
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <textarea 
                className="w-full h-56 p-4 bg-slate-50 rounded-2xl text-sm border-none focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
                placeholder="Paste career details..."
                onChange={(e) => setUserInfo(e.target.value)}
              />

              <div className="relative h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden">
                <input type="file" onChange={handleImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                <span className="text-xs font-bold text-slate-400">{base64Image ? "✓ IMAGE COLOR SYNCED" : "UPLOAD COLOR REFERENCE"}</span>
              </div>

              <button 
                onClick={handleAnalyze} 
                disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white shadow-xl transition-all active:scale-95"
                style={{ backgroundColor: loading ? '#94a3b8' : resumeData.primaryColor }}
              >
                {loading ? "GENERATING CONTENT..." : "GENERATE SYSTEM"}
              </button>
            </div>
          </div>
        </aside>

        {/* CANVAS PREVIEW PANEL */}
        <main className="flex flex-col items-center">
          <div className="w-full max-w-[800px] flex justify-end mb-6">
            <button onClick={downloadPDF} className="bg-slate-900 text-white px-8 py-3 rounded-full text-xs font-bold hover:scale-105 transition-all shadow-md">
              DOWNLOAD PIXEL-PERFECT PDF
            </button>
          </div>

          {/* RENDERING ENGINE CANVAS CONTAINER */}
          <div 
            ref={resumeRef}
            className="bg-white w-[800px] min-h-[1100px] shadow-2xl transition-all duration-500 overflow-hidden text-left"
            style={{ color: resumeData.textColor }}
          >
            {resumeData.sections.length === 0 ? (
              // Initial Empty Blueprint State
              <div className="p-20 space-y-6">
                <h1 className="text-5xl font-black uppercase tracking-tight" style={{ color: resumeData.primaryColor }}>{resumeData.fullName}</h1>
                <p className="text-sm leading-relaxed max-w-xl opacity-75">{resumeData.summary}</p>
              </div>
            ) : selectedLayout === 'sidebar' ? (
              // LAYOUT 1: SIDEBAR CONTAINER
              <div className="flex min-h-[1100px]">
                <div className="w-[280px] p-12 text-white flex flex-col" style={{ backgroundColor: resumeData.primaryColor }}>
                  <h1 className="text-4xl font-black uppercase mb-6 leading-tight">{resumeData.fullName}</h1>
                  <p className="text-xs opacity-80 leading-relaxed mb-12">{resumeData.summary}</p>
                </div>
                <div className="flex-1 p-16 space-y-12 bg-white">
                  {resumeData.sections.map((s, i) => (
                    <div key={i} className="break-inside-avoid">
                      <h3 className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: resumeData.primaryColor }}>{s.heading}</h3>
                      <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{s.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedLayout === 'modern_grid' ? (
              // LAYOUT 2: ACCENT HEADER LAYER WITH SPLIT GRID BELOW
              <div className="bg-white min-h-[1100px]">
                <div className="p-16 text-white text-center" style={{ backgroundColor: resumeData.primaryColor }}>
                  <h1 className="text-5xl font-black uppercase tracking-tight mb-4">{resumeData.fullName}</h1>
                  <p className="text-sm max-w-2xl mx-auto opacity-90 leading-relaxed">{resumeData.summary}</p>
                </div>
                <div className="p-16 grid grid-cols-2 gap-12">
                  {resumeData.sections.map((s, i) => (
                    <div key={i} className={`break-inside-avoid ${i === 0 || i === 1 ? 'col-span-2' : 'col-span-1'}`}>
                      <h3 className="text-xs font-black uppercase tracking-wider mb-4 border-b pb-2" style={{ color: resumeData.primaryColor, borderColor: `${resumeData.accentColor}33` }}>{s.heading}</h3>
                      <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{s.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // LAYOUT 3: EDITORIAL STACKED TOP-DOWN FORMAT (CLASSIC)
              <div className="p-20 bg-white">
                <header className="text-center mb-16">
                  <h1 className="text-6xl font-black tracking-tighter uppercase mb-4" style={{ color: resumeData.primaryColor }}>{resumeData.fullName}</h1>
                  <p className="italic text-sm max-w-lg mx-auto leading-relaxed" style={{ color: resumeData.accentColor }}>{resumeData.summary}</p>
                  <div className="h-[2px] w-16 mx-auto mt-6" style={{ backgroundColor: resumeData.primaryColor }} />
                </header>
                <div className="space-y-12">
                  {resumeData.sections.map((s, i) => (
                    <section key={i} className="break-inside-avoid">
                      <h3 className="text-xs font-bold tracking-[0.4em] uppercase mb-4" style={{ color: resumeData.primaryColor }}>{s.heading}</h3>
                      <div className="text-sm leading-loose border-l-2 pl-8 whitespace-pre-wrap" style={{ borderLeftColor: resumeData.primaryColor }}>
                        {s.content}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}