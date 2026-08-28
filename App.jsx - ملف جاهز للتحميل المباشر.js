import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Play, Pause, Square, Settings, Upload, Download, Save, Edit3, Menu, X, Globe, ChevronLeft, ChevronRight, Volume2, Check, Plus, Trash2, LogIn, LogOut, Music, FileAudio } from 'lucide-react';

const DEFAULT_CHAPTERS = [
  { id: 'front', title_ar: '🔹 المقدمات', title_en: 'Front Matter', content_ar: 'الإهداء\n\nإلى كل نفسٍ ما زالت تبحث عن معناها الحقيقي وسط زحام الحياة.', content_en: 'Dedication\n\nTo every soul still searching for its true meaning.' },
  { id: 'ch1', title_ar: 'الفصل الأول: وقفة البداية', title_en: 'Chapter One: The Beginning Pause', content_ar: 'في زمنٍ تتسارع فيه الخُطوات وتتعالى فيه الأصوات، تصبح وقفة الإنسان مع نفسه ضرورةً من ضرورات الوعي.', content_en: 'In an age where footsteps quicken and voices grow louder, a person\'s pause with their soul becomes a necessity of consciousness.' },
];

const STORAGE_KEY = 'waqfa-book-chapters-v1';
const ADMIN_PASS = 'admin123';

export default function BookPlatform() {
  const [chapters, setChapters] = useState(DEFAULT_CHAPTERS);
  const [activeIdx, setActiveIdx] = useState(0);
  const [lang, setLang] = useState('both');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [editBuffer, setEditBuffer] = useState({});
  const [saveStatus, setSaveStatus] = useState('');
  const [voiceRate, setVoiceRate] = useState(1);
  const [audioFiles, setAudioFiles] = useState({});
  const audioElRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const utteranceRef = useRef(null);
  const fileInputRef = useRef(null);

  const t = (ar, en) => (lang === 'ar' ? ar : en);

  const persist = useCallback((newChapters) => {
    setSaveStatus(t('تم الحفظ ✓', 'Saved ✓'));
    setTimeout(() => setSaveStatus(''), 2000);
  }, [lang]);

  const activeChapter = chapters[activeIdx];

  const handleAudioUpload = (e, chapterId) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioFiles(prev => {
      const old = prev[chapterId];
      if (old && old.url) URL.revokeObjectURL(old.url);
      return { ...prev, [chapterId]: { url, name: file.name } };
    });
    setAudioProgress(0);
    setAudioPlaying(false);
  };

  const removeAudio = (chapterId) => {
    setAudioFiles(prev => {
      const old = prev[chapterId];
      if (old && old.url) URL.revokeObjectURL(old.url);
      const next = { ...prev };
      delete next[chapterId];
      return next;
    });
  };

  const toggleAudioPlay = () => {
    if (!audioElRef.current) return;
    if (audioPlaying) { audioElRef.current.pause(); } else { audioElRef.current.play(); }
  };

  const stopAudio = () => {
    if (!audioElRef.current) return;
    audioElRef.current.pause();
    audioElRef.current.currentTime = 0;
    setAudioPlaying(false);
    setAudioProgress(0);
  };

  const seekAudio = (e) => {
    if (!audioElRef.current) return;
    const val = parseFloat(e.target.value);
    audioElRef.current.currentTime = val;
    setAudioProgress(val);
  };

  const currentAudio = audioFiles[activeChapter?.id];

  useEffect(() => { stopAudio(); }, [activeIdx]);

  const speechSupported = typeof window !== 'undefined' && !!window.speechSynthesis && typeof SpeechSynthesisUtterance !== 'undefined';

  const stopSpeech = () => {
    if (!speechSupported) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
    setIsPlaying(false);
    setIsPaused(false);
  };

  const playSpeech = () => {
    if (!speechSupported || !activeChapter) return;
    try {
      window.speechSynthesis.cancel();
      const textAr = activeChapter.content_ar;
      const textEn = activeChapter.content_en;
      const textToRead = lang === 'en' ? textEn : lang === 'ar' ? textAr : `${textAr}. ${textEn}`;
      const utter = new SpeechSynthesisUtterance(textToRead);
      utter.lang = lang === 'en' ? 'en-US' : 'ar-SA';
      utter.rate = voiceRate;
      utter.onend = () => { setIsPlaying(false); setIsPaused(false); };
      utter.onerror = () => { setIsPlaying(false); setIsPaused(false); };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
      setIsPlaying(true);
      setIsPaused(false);
    } catch (e) { setIsPlaying(false); setIsPaused(false); }
  };

  const togglePause = () => {
    if (!speechSupported) return;
    try {
      if (isPaused) { window.speechSynthesis.resume(); setIsPaused(false); }
      else { window.speechSynthesis.pause(); setIsPaused(true); }
    } catch (e) {}
  };

  useEffect(() => {
    return () => { if (speechSupported) { try { window.speechSynthesis.cancel(); } catch (e) {} } };
  }, []);

  useEffect(() => { stopSpeech(); }, [activeIdx]);

  const handleLogin = () => {
    if (passInput === ADMIN_PASS) {
      setIsAdmin(true); setLoginOpen(false); setPassInput(''); setDashboardOpen(true);
    } else { alert(t('كلمة مرور خاطئة', 'Wrong password')); }
  };

  const startEdit = (chapter) => setEditBuffer({ ...chapter });

  const saveEdit = () => {
    const newChapters = chapters.map(c => c.id === editBuffer.id ? editBuffer : c);
    setChapters(newChapters);
    persist(newChapters);
    setEditBuffer({});
  };

  const addChapter = () => {
    const newCh = { id: 'ch_' + Date.now(), title_ar: t('فصل جديد', 'New Chapter'), title_en: 'New Chapter', content_ar: '', content_en: '' };
    const newChapters = [...chapters, newCh];
    setChapters(newChapters);
    persist(newChapters);
  };

  const deleteChapter = (id) => {
    if (!window.confirm(t('هل أنت متأكد من الحذف؟', 'Are you sure?'))) return;
    const newChapters = chapters.filter(c => c.id !== id);
    setChapters(newChapters);
    persist(newChapters);
    if (activeIdx >= newChapters.length) setActiveIdx(0);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !editBuffer.id) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditBuffer(prev => ({ ...prev, content_ar: ev.target.result }));
    reader.readAsText(file, 'UTF-8');
  };

  const downloadBook = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:'Traditional Arabic',serif;margin:2cm;}
      .ar{direction:rtl;text-align:right;font-size:16pt;line-height:1.8;white-space:pre-wrap;margin-bottom:20pt;}
      .en{direction:ltr;text-align:left;font-size:13pt;line-height:1.6;white-space:pre-wrap;margin-bottom:20pt;}
      h2{color:#7a4a1a;text-align:center;}
      .div{text-align:center;margin:24pt 0;page-break-after:always;}
    </style></head><body>`;
    chapters.forEach(c => {
      html += `<h2>${c.title_ar} / ${c.title_en}</h2>`;
      html += `<div class="ar">${c.content_ar.replace(/\n/g, '<br>')}</div>`;
      html += `<div class="en">${c.content_en.replace(/\n/g, '<br>')}</div>`;
      html += `<div class="div"></div>`;
    });
    html += `</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'waqfa-maa-alnafs-book.html'; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadChapterText = (c) => {
    const content = `${c.title_ar}\n${c.title_en}\n\n${c.content_ar}\n\n---\n\n${c.content_en}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${c.id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-amber-950 text-white" style={{ fontFamily: lang === 'ar' ? 'Traditional Arabic, serif' : 'Georgia, serif' }}>
      <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-amber-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 hover:bg-white/10 rounded-lg">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-bold text-amber-300 hidden sm:inline">🕊️ {t('وقفة مع النفس', 'A Pause with the Soul')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLang(lang === 'ar' ? 'en' : lang === 'en' ? 'both' : 'ar')} className="flex items-center gap-1 bg-amber-600/80 hover:bg-amber-500 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Globe size={14} /> {lang === 'ar' ? 'AR' : lang === 'en' ? 'EN' : 'AR/EN'}
          </button>
          {isAdmin ? (
            <button onClick={() => setDashboardOpen(true)} className="flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Settings size={14} /> {t('لوحة التحكم', 'Dashboard')}
            </button>
          ) : (
            <button onClick={() => setLoginOpen(true)} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold">
              <LogIn size={14} /> {t('دخول المدير', 'Admin')}
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        {menuOpen && (
          <div className="fixed inset-0 z-30 bg-black/60" onClick={() => setMenuOpen(false)}>
            <div className={`absolute top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} h-full w-72 bg-slate-900 border-amber-500/20 ${lang==='ar'?'border-l':'border-r'} p-4 overflow-y-auto`} onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-amber-300 mb-4">{t('الفهرس', 'Contents')}</h3>
              {chapters.map((c, i) => (
                <button key={c.id} onClick={() => { setActiveIdx(i); setMenuOpen(false); }}
                  className={`w-full text-right p-3 mb-1 rounded-lg text-sm transition ${activeIdx === i ? 'bg-amber-600/30 text-amber-200' : 'hover:bg-white/5 text-slate-300'}`}>
                  {t(c.title_ar, c.title_en)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 max-w-3xl mx-auto px-6 py-10">
          <h1 className="text-2xl font-bold text-amber-300 mb-2 text-center">{t(activeChapter?.title_ar, activeChapter?.title_en)}</h1>
          <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full mb-8"></div>

          {currentAudio ? (
            <div className="mb-8 bg-white/5 rounded-2xl p-4">
              <audio ref={audioElRef} src={currentAudio.url}
                onPlay={() => setAudioPlaying(true)} onPause={() => setAudioPlaying(false)}
                onEnded={() => { setAudioPlaying(false); setAudioProgress(0); }}
                onTimeUpdate={(e) => setAudioProgress(e.target.currentTime)}
                onLoadedMetadata={(e) => setAudioDuration(e.target.duration)} className="hidden" />
              <div className="flex items-center gap-3 mb-2">
                <button onClick={toggleAudioPlay} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-full flex-shrink-0">
                  {audioPlaying ? <Pause size={18} /> : <Play size={18} />} {audioPlaying ? t('إيقاف مؤقت', 'Pause') : t('استمع', 'Listen')}
                </button>
                <button onClick={stopAudio} className="flex items-center gap-2 bg-red-600/80 hover:bg-red-500 px-4 py-2.5 rounded-full flex-shrink-0">
                  <Square size={16} />
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <FileAudio size={14} className="text-amber-300 flex-shrink-0" />
                  <input type="range" min="0" max={audioDuration || 0} value={audioProgress} onChange={seekAudio} className="w-full" />
                </div>
              </div>
              <p className="text-xs text-slate-400 text-center truncate">🎵 {currentAudio.name}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 mb-8 bg-white/5 rounded-2xl p-4 flex-wrap">
              {!speechSupported ? (
                <div className="text-center text-amber-300 text-sm px-2">
                  ⚠️ {t('لا يوجد ملف صوتي مرفوع لهذا الفصل، وميزة النطق الآلي غير مدعومة هنا. ارفع ملف MP3 من لوحة التحكم.', 'No audio uploaded, and auto speech is unsupported here. Upload an MP3 from the dashboard.')}
                </div>
              ) : !isPlaying ? (
                <button onClick={playSpeech} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-full">
                  <Play size={18} /> {t('استمع (صوت آلي)', 'Listen (Auto Voice)')}
                </button>
              ) : (
                <>
                  <button onClick={togglePause} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-5 py-2.5 rounded-full">
                    {isPaused ? <Play size={18} /> : <Pause size={18} />} {isPaused ? t('استئناف', 'Resume') : t('إيقاف مؤقت', 'Pause')}
                  </button>
                  <button onClick={stopSpeech} className="flex items-center gap-2 bg-red-600/80 hover:bg-red-500 px-4 py-2.5 rounded-full">
                    <Square size={16} /> {t('إيقاف', 'Stop')}
                  </button>
                </>
              )}
              {speechSupported && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Volume2 size={16} />
                  <input type="range" min="0.5" max="1.5" step="0.1" value={voiceRate} onChange={e => setVoiceRate(parseFloat(e.target.value))} className="w-20" />
                </div>
              )}
            </div>
          )}

          <div className="bg-white/5 rounded-2xl p-6 md:p-8 space-y-6">
            {(lang === 'ar' || lang === 'both') && (
              <p className="text-lg leading-loose whitespace-pre-wrap text-right" style={{ direction: 'rtl' }}>{activeChapter?.content_ar}</p>
            )}
            {lang === 'both' && <div className="border-t border-white/10"></div>}
            {(lang === 'en' || lang === 'both') && (
              <p className="text-base leading-relaxed whitespace-pre-wrap text-left" style={{ direction: 'ltr' }}>{activeChapter?.content_en}</p>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button disabled={activeIdx === 0} onClick={() => setActiveIdx(activeIdx - 1)} className="flex items-center gap-1 px-4 py-2 bg-white/10 rounded-lg disabled:opacity-30">
              <ChevronLeft size={16} /> {t('السابق', 'Previous')}
            </button>
            <span className="text-xs text-slate-400 self-center">{activeIdx + 1} / {chapters.length}</span>
            <button disabled={activeIdx === chapters.length - 1} onClick={() => setActiveIdx(activeIdx + 1)} className="flex items-center gap-1 px-4 py-2 bg-white/10 rounded-lg disabled:opacity-30">
              {t('التالي', 'Next')} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loginOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-amber-300 mb-4">{t('دخول المدير', 'Admin Login')}</h3>
            <input type="password" value={passInput} onChange={e => setPassInput(e.target.value)} placeholder={t('كلمة المرور', 'Password')}
              className="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 mb-4 text-white" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <p className="text-xs text-slate-400 mb-4">{t('كلمة المرور الافتراضية: admin123', 'Default password: admin123')}</p>
            <div className="flex gap-2">
              <button onClick={handleLogin} className="flex-1 bg-amber-500 text-slate-900 font-bold py-2 rounded-lg">{t('دخول', 'Login')}</button>
              <button onClick={() => setLoginOpen(false)} className="flex-1 bg-white/10 py-2 rounded-lg">{t('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {dashboardOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto bg-slate-900 rounded-2xl p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-amber-300">{t('لوحة التحكم', 'Dashboard')}</h2>
              <div className="flex gap-2">
                <button onClick={() => { setIsAdmin(false); setDashboardOpen(false); }} className="flex items-center gap-1 text-xs bg-red-600/60 px-3 py-1.5 rounded-lg">
                  <LogOut size={14} /> {t('خروج', 'Logout')}
                </button>
                <button onClick={() => setDashboardOpen(false)} className="p-2 hover:bg-white/10 rounded-lg"><X size={18} /></button>
              </div>
            </div>
            {saveStatus && <div className="mb-4 text-emerald-400 text-sm flex items-center gap-1"><Check size={14} />{saveStatus}</div>}
            <div className="flex gap-2 mb-6 flex-wrap">
              <button onClick={addChapter} className="flex items-center gap-1 bg-emerald-600 px-4 py-2 rounded-lg text-sm font-semibold">
                <Plus size={16} /> {t('إضافة فصل جديد', 'Add New Chapter')}
              </button>
              <button onClick={downloadBook} className="flex items-center gap-1 bg-blue-600 px-4 py-2 rounded-lg text-sm font-semibold">
                <Download size={16} /> {t('تحميل الكتاب كاملاً', 'Download Full Book')}
              </button>
            </div>
            <div className="space-y-3">
              {chapters.map((c) => (
                <div key={c.id} className="bg-white/5 rounded-xl p-4">
                  {editBuffer.id === c.id ? (
                    <div className="space-y-3">
                      <input value={editBuffer.title_ar} onChange={e => setEditBuffer({ ...editBuffer, title_ar: e.target.value })}
                        placeholder={t('العنوان العربي', 'Arabic Title')} className="w-full bg-slate-950 border border-white/20 rounded-lg px-3 py-2 text-right" dir="rtl" />
                      <input value={editBuffer.title_en} onChange={e => setEditBuffer({ ...editBuffer, title_en: e.target.value })}
                        placeholder={t('العنوان الإنجليزي', 'English Title')} className="w-full bg-slate-950 border border-white/20 rounded-lg px-3 py-2" />
                      <textarea value={editBuffer.content_ar} onChange={e => setEditBuffer({ ...editBuffer, content_ar: e.target.value })}
                        placeholder={t('المحتوى العربي', 'Arabic Content')} rows={6} className="w-full bg-slate-950 border border-white/20 rounded-lg px-3 py-2 text-right" dir="rtl" />
                      <textarea value={editBuffer.content_en} onChange={e => setEditBuffer({ ...editBuffer, content_en: e.target.value })}
                        placeholder={t('المحتوى الإنجليزي', 'English Content')} rows={6} className="w-full bg-slate-950 border border-white/20 rounded-lg px-3 py-2" />
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-1 bg-purple-600 px-3 py-1.5 rounded-lg text-xs">
                          <Upload size={14} /> {t('رفع ملف نصي', 'Upload Text File')}
                        </button>
                        <input ref={fileInputRef} type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                        <button onClick={saveEdit} className="flex items-center gap-1 bg-amber-500 text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold">
                          <Save size={14} /> {t('حفظ', 'Save')}
                        </button>
                        <button onClick={() => setEditBuffer({})} className="bg-white/10 px-4 py-1.5 rounded-lg text-xs">{t('إلغاء', 'Cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-sm flex items-center gap-2">
                        {t(c.title_ar, c.title_en)}
                        {audioFiles[c.id] && <Music size={14} className="text-emerald-400" />}
                      </span>
                      <div className="flex gap-2 items-center">
                        <label className="p-2 hover:bg-white/10 rounded-lg cursor-pointer">
                          <Music size={14} />
                          <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, c.id)} />
                        </label>
                        {audioFiles[c.id] && (
                          <button onClick={() => removeAudio(c.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><X size={14} /></button>
                        )}
                        <button onClick={() => startEdit(c)} className="p-2 hover:bg-white/10 rounded-lg"><Edit3 size={14} /></button>
                        <button onClick={() => downloadChapterText(c)} className="p-2 hover:bg-white/10 rounded-lg"><Download size={14} /></button>
                        <button onClick={() => deleteChapter(c.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-6 text-slate-500 text-xs border-t border-white/10">
        {t('وقفة مع النفس © الدكتور منصور علي الصعيدي', 'A Pause with the Soul © Dr. Mansour Ali Al-Saidi')}
      </div>
    </div>
  );
}