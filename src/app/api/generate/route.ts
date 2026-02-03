import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { topic, count } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    // 빌드 시점에 터지지 않도록 핸들러 내부에서 초기화
    const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

    let finalQuestions = [];

    // 1. DB 캐시 확인 (Supabase가 설정된 경우만)
    if (supabase) {
      try {
        const { count: dbCount } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('topic', topic);

        if (dbCount && dbCount >= 100) {
          const { data } = await supabase.from('questions').select('*').eq('topic', topic).limit(count);
          if (data && data.length >= count) finalQuestions = data;
        } else if (dbCount && dbCount > 50) {
          const { data: dbData } = await supabase.from('questions').select('*').eq('topic', topic).limit(Math.floor(count / 2));
          const aiQuestions = await generateAIQuestions(topic, Math.ceil(count / 2), apiKey, unsplashKey, supabase);
          finalQuestions = [...(dbData || []), ...aiQuestions];
        }
      } catch (e) {
        console.error('Supabase Query Error:', e);
      }
    }

    // 2. 데이터가 부족하면 AI 생성
    if (finalQuestions.length < count) {
      const remaining = count - finalQuestions.length;
      const aiQuestions = await generateAIQuestions(topic, remaining, apiKey, unsplashKey, supabase);
      finalQuestions = [...finalQuestions, ...aiQuestions];
    }

    return NextResponse.json(finalQuestions.sort(() => Math.random() - 0.5));
  } catch (error: any) {
    console.error('Final API Error:', error);
    return NextResponse.json([{
      option1: "평생 사이다", option2: "평생 콜라",
      img1: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800",
      img2: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800"
    }]);
  }
}

async function generateAIQuestions(topic: string, count: number, apiKey: string, unsplashKey: string, supabase: any) {
  const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const prompt = `주제: "${topic}". 아주 짧고 강렬한 밸런스 질문 ${count}개. JSON 배열: [{"option1":"선택지1","option2":"선택지2","kw1":"EnglishNoun1","kw2":"EnglishNoun2"}]`;

  const res = await fetch(geminiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await res.json();
  const text = data.candidates[0].content.parts[0].text;
  const jsonStr = text.match(/\[.*\]/s)?.[0] || '[]';
  const questions = JSON.parse(jsonStr);

  const fetchImg = async (kw: string) => {
    try {
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(kw)}&per_page=1`, {
        headers: { Authorization: `Client-ID ${unsplashKey}` }
      });
      const d = await res.json();
      return d.results[0]?.urls?.regular || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800`;
    } catch { return "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800"; }
  };

  return await Promise.all(questions.map(async (q: any) => {
    const [img1, img2] = await Promise.all([fetchImg(q.kw1), fetchImg(q.kw2)]);
    const newQ = { ...q, img1, img2, topic };
    if (supabase) {
      supabase.from('questions').insert([newQ]).then(() => {});
    }
    return newQ;
  }));
}
