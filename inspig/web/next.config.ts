import type { NextConfig } from "next";
import { execSync } from "child_process";

// Git commit hash를 빌드 ID로 사용 - 이중화 서버 간 빌드 ID 일치 보장
const getGitCommitHash = (): string => {
  try {
    return execSync("git rev-parse HEAD").toString().trim().slice(0, 12);
  } catch {
    return `build-${Date.now()}`;
  }
};

const nextConfig: NextConfig = {
  output: 'standalone', // Docker 배포를 위한 설정

  // 이중화 서버(38/99)에서 같은 소스면 같은 빌드 ID 생성
  generateBuildId: async () => getGitCommitHash(),

  // 실험적 기능: PPR 비활성화 및 동적 렌더링 강제
  experimental: {
    // 정적 생성 비활성화 - 모든 페이지를 동적으로 렌더링
    ppr: false,
  },

  // HTTP 헤더 설정 - RSC 캐시 비활성화
  async headers() {
    return [
      {
        // 모든 페이지에 적용
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
