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
          content="놓치기 쉬운 보험 권리를 약관 근거와 필요한 서류까지 쉽게 확인하는 서비스"
        />
        <title>권리찾기 · 보험을 쉽게 확인해요</title>
        <link rel="icon" href="./icon.svg" type="image/svg+xml" />
        <link rel="manifest" href="./manifest.json" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

