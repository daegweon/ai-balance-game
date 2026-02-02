'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, ArrowRight, Play, Share2, Copy, Users, Star, Info, ImageOff } from 'lucide-react';

const TOPICS = [
  { name: '연애', premium: false },
  { name: '직장생활', premium: false },
  { name: '음식', premium: false },
  { name: '공포', premium: true }
];

export default function Home() {
  const [step, setStep] = useState<'intro' | 'setup' | 'play' | 'result'>('intro');
  const [topic, setTopic] = useState('연애');
  const [totalRounds, setTotalRounds] = useState(8);
  
  const [matchPool, setMatchPool] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [matchIdx, setMatchIdx] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(8);
  
  const [champion, setChampion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [userCount, setUserCount] = useState(2451);

  useEffect(() => {
    const timer = setInterval(() => setUserCount(p => p + Math.floor(Math.random() * 2)), 3000);
    return () => clearInterval(timer);
  }, []);

  const startTournament = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: totalRounds })
      });
      const data = await res.json();
      
      const initialMatches = [];
      for (let i = 0; i < data.length; i += 2) {
        if (data[i] && data[i+1]) {
          initialMatches.push({ left: data[i], right: data[i+1] });
        }
      }
      
      setMatchPool(initialMatches);
      setWinners([]);
      setMatchIdx(0);
      setCurrentLevel(totalRounds);
      setStep('play');
    } catch (error) {
      alert('AI가 너무 바쁘네요! 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (winner: any) => {
    const newWinners = [...winners, winner];
    
    if (matchIdx < matchPool.length - 1) {
      setWinners(newWinners);
      setMatchIdx(prev => prev + 1);
    } else {
      // 라운드 종료
      if (newWinners.length === 1) {
        setChampion(newWinners[0]);
        setStep('result');
      } else {
        // 다음 라운드 대진표 구성 (안전하게 짝수 보장)
        const nextMatches = [];
        for (let i = 0; i < newWinners.length; i += 2) {
          if (newWinners[i] && newWinners[i+1]) {
            nextMatches.push({ left: newWinners[i], right: newWinners[i+1] });
          } else if (newWinners[i]) {
            // 홀수일 경우 부전승 처리
            newWinners.push(newWinners[i]); 
          }
        }
        setMatchPool(nextMatches);
        setWinners([]);
        setMatchIdx(0);
        setCurrentLevel(newWinners.length);
      }
    }
  };

  const currentMatch = matchPool[matchIdx];

  return (
    <main className="h-[100svh] w-screen bg-black text-white font-sans overflow-hidden select-none relative">
      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ scale: 1.1, opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 relative text-center">
            <div className="absolute top-12 flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <Users size={16} className="text-cyan-400" />
              <span className="text-sm font-bold text-neutral-400"><span className="text-white">{userCount.toLocaleString()}명</span>이 참전 중</span>
            </div>
            <h1 className="text-xl font-extralight tracking-[0.4em] uppercase mb-4 text-cyan-500/80 animate-pulse">AI Tournament</h1>
            <h1 className="text-7xl md:text-[12rem] font-black tracking-tighter uppercase leading-none italic mb-12">
              Balance<br/><span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-rose-500">Villain</span>
            </h1>
            <p className="text-neutral-500 max-w-sm mb-12 text-sm leading-relaxed">AI가 설계한 킹받는 난제들을 뚫고<br/>최고의 밸런스 브레이커를 가려내세요.</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setStep('setup')} className="px-20 py-8 bg-white text-black font-black text-3xl rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)]">CHALLENGE</motion.button>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
            <h2 className="flex items-center gap-2 text-cyan-400 font-black mb-8 uppercase tracking-widest text-xs"><Info size={14} /> Step 01. Choose Battlefield</h2>
            <div className="grid grid-cols-2 gap-4 w-full mb-16">
              {TOPICS.map(t => (
                <button key={t.name} onClick={() => setTopic(t.name)} className={`py-6 rounded-3xl font-bold text-xl border-2 transition-all relative ${topic === t.name ? 'bg-white text-black border-white scale-105' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>
                  {t.premium && <Star size={14} className="absolute top-4 right-4 text-yellow-500 fill-yellow-500" />} {t.name}
                </button>
              ))}
            </div>
            <h2 className="flex items-center gap-2 text-cyan-400 font-black mb-8 uppercase tracking-widest text-xs"><Info size={14} /> Step 02. Size</h2>
            <div className="flex gap-4 w-full mb-20">
              {[8, 16].map(n => (
                <button key={n} onClick={() => setTotalRounds(n)} className={`flex-1 py-6 rounded-3xl font-black text-2xl border-2 transition-all ${totalRounds === n ? 'bg-cyan-500 text-white border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>{n}강</button>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startTournament} disabled={loading} className="w-full py-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-2xl rounded-3xl shadow-2xl flex items-center justify-center gap-4">{loading ? <Loader2 className="animate-spin" /> : <>START THE SHOW <ArrowRight /></>}</motion.button>
          </motion.div>
        )}

        {step === 'play' && currentMatch && (
          <motion.div key={`${currentLevel}-${matchIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex flex-col md:flex-row relative bg-black">
             <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-10 py-3 rounded-full font-black text-sm tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                {currentLevel === 2 ? 'THE FINAL' : `${currentLevel}강 (${matchIdx + 1}/${matchPool.length})`}
             </div>
             <MatchCard data={currentMatch.left} onSelect={() => handleSelect(currentMatch.left)} color="from-cyan-900/80" />
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-white text-black font-black text-4xl md:text-6xl p-6 md:p-10 rounded-full border-[15px] border-black shadow-[0_0_100px_rgba(255,255,255,0.3)] italic">VS</motion.div>
             </div>
             <MatchCard data={currentMatch.right} onSelect={() => handleSelect(currentMatch.right)} color="from-rose-900/80" />
          </motion.div>
        )}

        {step === 'result' && champion && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-8 text-center relative bg-neutral-950">
            <div className="relative z-10 w-full max-w-lg bg-black border border-white/10 p-12 rounded-[3rem] shadow-[0_0_100px_rgba(6,182,212,0.1)]">
              <Trophy size={100} className="text-yellow-400 mb-8 mx-auto animate-bounce" />
              <h2 className="text-xs font-black text-cyan-400 tracking-[0.5em] uppercase mb-6">Ultimate Winner</h2>
              <h1 className="text-5xl md:text-[5rem] font-black text-white mb-16 tracking-tighter leading-none italic">{champion.option1}</h1>
              <div className="flex flex-col gap-4 mb-12">
                <button className="flex items-center justify-center gap-3 py-6 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-full font-black text-xl">STORY SHARE</button>
                <button onClick={() => alert('링크 복사 완료!')} className="flex items-center justify-center gap-3 py-6 bg-white/5 rounded-full font-bold text-neutral-400 border border-white/5">COPY LINK</button>
              </div>
              <button onClick={() => window.location.reload()} className="w-full py-6 bg-white text-black font-black text-xl rounded-full shadow-2xl">NEW GAME</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center px-12">
          <Loader2 className="animate-spin text-cyan-400 mb-8" size={80} />
          <h3 className="text-2xl font-black italic tracking-tighter text-white mb-2 uppercase">AI Generating...</h3>
        </div>
      )}
    </main>
  );
}

function MatchCard({ data, onSelect, color }: any) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <motion.div whileHover={{ flex: 1.2 }} onClick={onSelect} className="h-1/2 md:h-full flex-1 relative cursor-pointer group overflow-hidden transition-all duration-700 border-white/5 border bg-neutral-900 flex items-center justify-center">
      <img 
        src={data.img1} 
        alt={data.option1} 
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] group-hover:scale-125 ${!imgLoaded ? 'blur-3xl opacity-0' : 'blur-0 opacity-100'}`}
        onLoad={() => setImgLoaded(true)}
      />
      {!imgLoaded && <div className="absolute inset-0 bg-neutral-900 animate-pulse" />}
      <div className={`absolute inset-0 bg-gradient-to-t ${color} via-transparent to-black/20 opacity-90`} />
      <div className="absolute inset-0 flex items-center justify-center p-8 md:p-24">
        <h2 className="text-4xl md:text-[7rem] font-black text-center text-white leading-none drop-shadow-[0_15px_40px_rgba(0,0,0,0.8)] break-keep tracking-tighter italic uppercase">{data.option1}</h2>
      </div>
    </motion.div>
  );
}
