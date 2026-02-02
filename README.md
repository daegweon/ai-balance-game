# AI 밸런스 게임 (n강 토너먼트) 🎮

AI가 실시간으로 생성하는 킹받는 질문들과 웹 이미지를 결합한 타임킬링 밸런스 게임 서비스입니다.

## 🚀 주요 기능
- **AI 기반 테마 생성**: 사용자가 입력한 주제로 AI가 밸런스 게임 질문을 무한 생성합니다.
- **실시간 이미지 매칭**: Unsplash API를 연동하여 각 선택지에 딱 맞는 고퀄리티 이미지를 보여줍니다.
- **n강 토너먼트**: 8강, 16강, 32강 등 사용자가 원하는 규모로 게임을 즐길 수 있습니다.
- **결과 공유**: 내 선택 결과와 성향 분석을 SNS에 공유할 수 있습니다.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS, Shadcn/UI, Framer Motion
- **Database/Auth**: Supabase
- **AI**: Google Gemini-Flash (Generative AI)
- **Images**: Unsplash API

## ⚙️ 시작하기
1. `.env.example` 파일을 `.env.local`로 복사하고 필요한 API 키를 입력하세요.
2. `npm install`
3. `npm run dev`
