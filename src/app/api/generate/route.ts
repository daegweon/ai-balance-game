import { NextResponse } from 'next/server';

// 마이크의 지적 반영: 낮은 가용성과 레이턴시 해결을 위한 캐싱 로직
const cache: Record<string, any> = {};

async function fetchWithRetry(url: string, options: any, retries = 2) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
  }
  return fetch(url, options);
}

export async function POST(req: Request) {
  try {
    const { topic, count, exclude = [] } = await req.json();

    // 1. 캐시 확인 (레이턴시 감소)
    if (cache[topic]) {
      console.log(`Cache hit for topic: ${topic}`);
      return NextResponse.json(cache[topic]);
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const prompt = `주제: "${topic}". 
    이 주제로 세상에서 가장 킹받고 고르기 힘든 밸런스 게임 질문 ${count}개를 만들어줘.
    
    [가이드라인]
    1. 뻔한 질문(예: 짜장 vs 짬뽕)은 절대 금지. 상상력의 한계를 시험하는 질문을 만들 것.
    2. 질문은 10자 이내로 매우 짧고 임팩트 있게.
    3. 각 질문은 서로 완전히 다른 소재여야 함.
    4. 제외 목록: ${exclude.join(', ')} (이 내용과 비슷한 소재는 피해줘).
    
    결과는 반드시 아래 JSON 배열 형식으로만 응답해:
    [
      { "option1": "소름돋는선택지1", "option2": "소름돋는선택지2", "kw1": "SingleEnglishNoun1", "kw2": "SingleEnglishNoun2" }
    ]`;

    // 2. fetchWithRetry 적용 (가용성 향상)
    const geminiRes = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      cache: 'no-store'
    });

    const geminiData = await geminiRes.json();
    const text = geminiData.candidates[0].content.parts[0].text;
    const jsonStr = text.match(/\[.*\]/s)?.[0] || '[]';
    const questions = JSON.parse(jsonStr);

    const fetchImg = async (kw: string) => {
      try {
        const res = await fetchWithRetry(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(kw)}&per_page=1`, {
          headers: { Authorization: `Client-ID ${unsplashKey}` }
        });
        const d = await res.json();
        return d.results[0]?.urls?.regular || `https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800`;
      } catch {
        return "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800";
      }
    };

    const processedQuestions = await Promise.all(questions.map(async (q: any) => {
      const [img1, img2] = await Promise.all([fetchImg(q.kw1), fetchImg(q.kw2)]);
      return { ...q, img1, img2, id: Math.random().toString(36).substr(2, 9) };
    }));

    // 결과 캐싱
    if (processedQuestions.length > 0) {
      cache[topic] = processedQuestions;
    }

    return NextResponse.json(processedQuestions);
  } catch (error: any) {
    // 3. 3중 안전장치: 최종 고정 데이터셋 반환
    return NextResponse.json([{
      option1: "평생 라면만", option2: "평생 치킨무만",
      img1: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=800",
      img2: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800",
      id: "fallback"
    }]);
  }
}
