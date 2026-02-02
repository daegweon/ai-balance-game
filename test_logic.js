
import { handleSelect, winners, matchPool, matchIdx, currentLevel } from './logic';

// 1. handleSelect 로직에서 winners가 홀수일 때의 대진표 생성 로직 점검.
function testHandleSelectOdd() {
  console.log("Testing handleSelect with odd number of winners...");
  
  // 상황: 8강에서 4명이 뽑혔는데, 로직상 무언가 꼬여서 3명만 winners에 들어갔다고 가정하거나
  // 혹은 8강 -> 4강 -> 2강(결승) -> 우승 인데
  // 만약 8강에서 5명이 winners가 되었다면? (비정상적인 상황이지만 로직 방어 확인)
  
  let currentWinners = [{id:1}, {id:2}, {id:3}]; // 홀수
  const nextMatches = [];
  for (let i = 0; i < currentWinners.length; i += 2) {
    // i=0: left=1, right=2
    // i=2: left=3, right=undefined !! -> Error
    nextMatches.push({ left: currentWinners[i], right: currentWinners[i+1] });
  }
  console.log("Next matches generated:", nextMatches);
  if (nextMatches.some(m => !m.right)) {
    console.error("CRITICAL: Undefined reference in match creation!");
  }
}

testHandleSelectOdd();
