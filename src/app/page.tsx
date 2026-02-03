'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Trophy, Play, Share2, Copy, Users, RefreshCw, Home as HomeIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const TOPICS = [
  { name: '연애', premium: false },
  { name: '직장생활', premium: false },
  { name: '음식', premium: false },
  { name: '공포', premium: true }
];

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 }
};

export default function Home() {
  const [step, setStep] = useState<'intro' | 'setup' | 'play' | 'result'>('intro');
  const [topic, setTopic] = useState('연애');
  const [totalRounds, setTotalRounds] = useState(8);
  
  const [matchPool, setMatchPool] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [matchIdx, setMatchIdx] = useState(0);
  
  const [champion, setChampion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bestQuestion, setBestQuestion] = useState("현재 1위: '평생 라면' vs '평생 치킨무'");
  const [userCount, setUserCount] = useState(3120);

  // v1.12: 네비게이션 로직 전면 수정
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let userId = localStorage.getItem('ai_worldcup_user_id');
      if (!userId) {
        userId = uuidv4();
        localStorage.setItem('ai_worldcup_user_id', userId);
      }

      // 초기 진입 시 히스토리 상태 강제 주입 (튕김 방지)
      if (!window.history.state) {
        window.history.replaceState({ step: 'intro' }, '', '');
      }

      const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.step) {
          setStep(event.state.step);
        } else {
          setStep('intro');
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const navigateTo = (nextStep: 'intro' | 'setup' | 'play' | 'result', useReplace = false) => {
    setStep(nextStep);
    if (typeof window !== 'undefined') {
      if (useReplace) {
        window.history.replaceState({ step: nextStep }, '', '');
      } else {
        window.history.pushState({ step: nextStep }, '', '');
      }
    }
  };

  const resetGame = () => {
    setMatchPool([]);
    setWinners([]);
    setMatchIdx(0);
    setChampion(null);
    navigateTo('intro', true); // 리셋할 때는 히스토리를 덮어씌움
  };

  const startTournament = async () => {
    setLoading(true);
    setProgress(10);
    
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + Math.random() * 10 : prev));
    }, 400);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count: totalRounds })
      });
      const data = await res.json();
      
      clearInterval(interval);
      setProgress(100);

      const initialMatches = [];
      for (let i = 0; i < data.length; i += 2) {
        if (data[i] && data[i+1]) {
          initialMatches.push({ left: data[i], right: data[i+1] });
        }
      }
      
      setTimeout(() => {
        if (initialMatches.length > 0) {
          setMatchPool(initialMatches);
          // 게임 시작 시에는 히스토리를 push 대신 replace로 해서 튕김 방지
          navigateTo('play', true);
        }
        setLoading(false);
      }, 500);

    } catch (error) {
      alert('월드컵 생성 실패!');
      setLoading(false);
    }
  };

  const handleSelect = (winner: any) => {
    const newWinners = [...winners, winner];
    if (matchIdx < matchPool.length - 1) {
      setWinners(newWinners);
      setMatchIdx(prev => prev + 1);
    } else {
      if (newWinners.length === 1) {
        setChampion(newWinners[0]);
        navigateTo('result');
      } else {
        const nextMatches = [];
        for (let i = 0; i < newWinners.length; i += 2) {
          if (newWinners[i] && newWinners[i+1]) {
            nextMatches.push({ left: newWinners[i], right: newWinners[i+1] });
          } else if (newWinners[i]) {
            newWinners.push(newWinners[i]); 
          }
        }
        setMatchPool(nextMatches);
        setWinners([]);
        setMatchIdx(0);
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'AI 이상형 월드컵',
      text: `내가 뽑은 ${topic} 우승자: ${champion.option1}! 당신의 선택은?`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        alert('링크가 복사되었습니다!');
      }
    } catch (err) { console.log(err); }
  };

  return (
    <main className="h-[100svh] w-screen bg-black text-white font-sans overflow-hidden select-none relative">
      {step !== 'intro' && !loading && (
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={resetGame}
          className="absolute top-8 left-8 z-[60] p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all backdrop-blur-md"
        >
          <HomeIcon size={20} className="text-white" />
        </motion.button>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="w-full max-w-md bg-white/10 h-1 rounded-full overflow-hidden mb-8 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <motion.div className="bg-gradient-to-r from-cyan-400 to-rose-500 h-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
            </div>
            <h2 className="text-6xl font-black italic mb-2 tracking-tighter">{Math.round(progress)}%</h2>
            <p className="text-cyan-400 font-bold tracking-[0.3em] uppercase text-xs mb-16 animate-pulse">Analyzing Matches</p>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] max-w-sm backdrop-blur-md shadow-2xl">
               <p className="text-neutral-500 text-[10px] mb-2 uppercase font-black tracking-widest">Real-time Ranking #1</p>
               <p className="text-white font-bold italic break-keep text-lg">{bestQuestion}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div key="intro" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full flex flex-col items-center justify-center p-8 bg-neutral-950 relative text-center">
            <div className="absolute top-12 flex items-center gap-2 bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <Users size={16} className="text-cyan-400" />
              <span className="text-sm font-medium text-neutral-400"><span className="text-white">{userCount.toLocaleString()}명</span> 플레이 중</span>
            </div>
            <h1 className="text-xl font-light tracking-[0.4em] uppercase mb-4 text-cyan-500/80">Premium AI</h1>
            <h1 className="text-6xl md:text-[9rem] font-black tracking-tighter uppercase leading-none mb-12 italic text-center">Match <span className="text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-rose-500 px-4">Up</span></h1>
            <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(255,255,255,0.3)" }} whileTap={{ scale: 0.9 }} onClick={() => navigateTo('setup')} className="px-20 py-8 bg-white text-black font-black text-2xl rounded-full shadow-2xl transition-all">시작하기</motion.button>
          </motion.div>
        )}

        {step === 'setup' && (
          <motion.div key="setup" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
            <h2 className="text-xs font-black mb-8 text-cyan-500 uppercase tracking-[0.4em] text-center">Select Theme</h2>
            <div className="grid grid-cols-2 gap-4 w-full mb-12">
              {TOPICS.map(t => (
                <button key={t.name} onClick={() => setTopic(t.name)} className={`py-6 rounded-3xl font-bold text-lg border-2 transition-all ${topic === t.name ? 'bg-white text-black border-white shadow-2xl scale-105' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>{t.name}</button>
              ))}
            </div>
            <h2 className="text-xs font-black mb-8 text-cyan-500 uppercase tracking-[0.4em] text-center">Rounds</h2>
            <div className="flex gap-4 w-full mb-16">
              {[8, 16].map(n => (
                <button key={n} onClick={() => setTotalRounds(n)} className={`flex-1 py-6 rounded-3xl font-black text-2xl border-2 transition-all ${totalRounds === n ? 'bg-cyan-500 text-white border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)] scale-105' : 'bg-neutral-900 text-neutral-500 border-neutral-800'}`}>{n}강</button>
              ))}
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={startTournament} className="w-full py-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-2xl rounded-3xl shadow-2xl">월드컵 생성</motion.button>
          </motion.div>
        )}

        {step === 'play' && matchPool.length > 0 && matchPool[matchIdx] && (
          <motion.div key={`${matchPool.length}-${matchIdx}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full flex flex-col md:flex-row relative bg-black p-2 md:p-6 gap-2 md:gap-6">
             <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-10 py-2 rounded-full font-black text-xs tracking-[0.2em] shadow-2xl">
                {matchPool.length === 1 ? 'FINAL' : `${matchPool.length * 2}강 (${matchIdx + 1}/${matchPool.length})`}
             </div>
             <MatchCard data={matchPool[matchIdx].left} onSelect={() => handleSelect(matchPool[matchIdx].left)} color="from-cyan-900/60" />
             <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white text-black font-black text-3xl md:text-5xl p-6 md:p-8 rounded-full border-[12px] border-neutral-950 shadow-2xl italic">VS</motion.div>
             </div>
             <MatchCard data={matchPool[matchIdx].right} onSelect={() => handleSelect(matchPool[matchIdx].right)} color="from-rose-900/60" />
          </motion.div>
        )}

        {step === 'result' && champion && (
          <motion.div key="result" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full flex flex-col items-center justify-center p-4 md:p-8 text-center relative bg-neutral-950">
            <div className="relative z-10 w-full max-w-2xl bg-black border border-white/10 p-8 md:p-12 rounded-[3.5rem] shadow-[0_0_100px_rgba(6,182,212,0.1)]">
              <Trophy size={80} className="text-yellow-400 mb-6 mx-auto animate-bounce" />
              <h2 className="text-xs font-black text-cyan-400 tracking-[0.5em] uppercase mb-6 text-center">World Cup Winner</h2>
              <div className="w-full overflow-hidden mb-16 flex justify-center">
                <h1 className="font-black text-white tracking-tighter italic uppercase drop-shadow-2xl whitespace-nowrap px-4"
                    style={{ fontSize: 'clamp(1.5rem, 7vw, 3.5rem)', lineHeight: '1.2' }}>
                  {champion.option1}
                </h1>
              </div>
              <div className="flex flex-col gap-4 mb-8">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.9 }} onClick={handleShare} className="flex items-center justify-center gap-3 py-6 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full font-black text-xl shadow-lg">
                  <Share2 size={24} /> 결과 공유하기
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.85 }} onClick={resetGame} className="flex items-center justify-center gap-3 py-6 bg-white/5 hover:bg-white/10 rounded-full font-bold text-neutral-400 border border-white/5 transition-all">
                  <RefreshCw size={20} /> 다시 하기
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function MatchCard({ data, onSelect, color }: any) {
  const [imgLoaded, setImgLoaded] = useState(false);
  return (
    <motion.div whileHover={{ scale: 1.01, flex: 1.05 }} whileTap={{ scale: 0.98 }} onClick={onSelect} className="flex-1 relative cursor-pointer group overflow-hidden bg-neutral-900 rounded-[2.5rem] border-2 border-white/5 flex flex-col transition-all duration-500">
      <div className="relative h-[65%] w-full overflow-hidden bg-neutral-800">
        <img src={data.img1} alt={data.option1} className={`absolute inset-0 w-full h-full object-cover transition-all duration-[3000ms] group-hover:scale-110 ${!imgLoaded ? 'blur-2xl opacity-0' : 'blur-0 opacity-100'}`} onLoad={() => setImgLoaded(true)} />
        {!imgLoaded && <div className="absolute inset-0 bg-neutral-900 animate-pulse" />}
        <div className={`absolute inset-0 bg-gradient-to-t ${color} via-transparent to-transparent opacity-60`} />
      </div>
      <div className="h-[35%] w-full flex items-center justify-center p-6 md:p-8 bg-gradient-to-b from-neutral-900 to-black">
        <h2 className="text-center font-black tracking-tighter leading-tight break-keep text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] italic uppercase" style={{ fontSize: 'clamp(1.2rem, 5vw, 2.5rem)' }}>{data.option1}</h2>
      </div>
    </motion.div>
  );
}
