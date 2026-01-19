/**
 * ============================================================================
 * 레이아웃 컴포넌트 (Layout Components)
 * ============================================================================
 * 
 * @description 페이지 레이아웃 구성 컴포넌트
 * @module components/layout
 * 
 * @components
 * - MainLayout  : 메인 레이아웃 (Header + Sidebar + Footer)
 * - Footer      : 하단 푸터 (홈, 뒤로가기 버튼)
 * 
 * @usage
 * import { MainLayout, Footer } from '@/components/layout';
 * 
 * @structure
 * MainLayout
 * ├── Header (상단)
 * ├── Sidebar (좌측, 토글)
 * ├── children (메인 콘텐츠)
 * └── Footer (하단, 선택적)
 * ============================================================================
 */

export { default as MainLayout } from './MainLayout';
export { default as Footer } from './Footer';
