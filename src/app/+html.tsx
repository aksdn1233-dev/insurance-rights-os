import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#F7F8FA" />
        <meta
          name="description"
          content="보험의 달인에서 받은 치료로 확인할 보험 혜택과 필요한 서류를 쉽게 살펴보세요."
        />
        <title>보험의 달인 · 놓치기 쉬운 보험 혜택 찾기</title>
        <link rel="icon" href="./icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="./manifest.json" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
