# Google Sheets 점수 기록 세팅 가이드

## 1. Google Sheets 생성

1. [Google Sheets](https://sheets.google.com)에서 새 스프레드시트 생성
2. 이름을 "micro:bit 게임 점수" 등으로 변경

## 2. Apps Script 배포

1. 메뉴에서 **확장 프로그램 > Apps Script** 클릭
2. 기존 코드를 모두 삭제하고, `Code.gs` 파일의 내용을 붙여넣기
3. **배포 > 새 배포** 클릭
4. 유형: **웹 앱** 선택
5. 설정:
   - 실행 주체: **나**
   - 액세스 권한: **모든 사용자**
6. **배포** 클릭
7. 권한 승인 (Google 계정 로그인)
8. **웹 앱 URL** 복사 (예: `https://script.google.com/macros/s/AKfyc.../exec`)

## 3. 게임에 URL 설정

프로젝트 루트에 `.env` 파일 생성:

```
VITE_SHEETS_URL=https://script.google.com/macros/s/여기에_복사한_URL/exec
```

그 후 빌드:

```bash
npm run build
```

## 4. 확인

- 학생이 게임을 플레이하면 스프레드시트에 자동으로 기록됨
- 시트에서 점수 정렬, 필터, 차트 등 자유롭게 활용

## 시트 구조

| playerName | gameId | score | input | createdAt |
|---|---|---|---|---|
| 홍길동 | dodge | 500 | microbit | 2026-03-30T12:00:00Z |
| 김철수 | dodge | 300 | keyboard | 2026-03-30T12:01:00Z |

## 팁

- 게임별 보기: gameId 열로 필터
- 최고점: score 열 내림차순 정렬
- 입력방식별: input 열로 필터
