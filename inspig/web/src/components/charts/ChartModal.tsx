'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui';
import { PieChart, PARITY_COLORS, GRADIENT_TEAL_BLUE } from '@/components/charts';
import dynamic from 'next/dynamic';
import { weeklyApi } from '@/services/api';

const BarChart = dynamic(() => import('@/components/charts/BarChart'), { ssr: false });

/**
 * 차트 타입 정의
 */
export type ChartType =
  | 'sowChart'           // 산차별 모돈현황
  | 'matingChart'        // 재귀일별 교배복수
  | 'parityReturn'       // 산차별 재귀일
  | 'accidentPeriod'     // 임신일별 사고복수
  | 'parityAccident'     // 산차별 사고원인
  | 'parityBirth'        // 산차별 분만성적
  | 'parityWean'         // 산차별 이유성적
  | 'cullingChart'       // 도폐사원인분포
  | 'shipmentAnalysis'   // 출하자료분석
  | 'carcassChart';      // 도체중/등지방분포

/**
 * 차트 설정 타입
 */
interface ChartConfig {
  title: string;
  subtitle?: string;
}

/**
 * 차트별 설정
 */
const chartConfigs: Record<ChartType, ChartConfig> = {
  sowChart: { title: '산차별 모돈현황' },
  matingChart: { title: '재귀일별 교배복수' },
  parityReturn: { title: '산차별 재귀일' },
  accidentPeriod: { title: '교배 임신일기준 사고복수', subtitle: '임돈전출/판매 제외' },
  parityAccident: { title: '산차별 사고원인' },
  parityBirth: { title: '산차별 분만성적' },
  parityWean: { title: '산차별 이유성적' },
  cullingChart: { title: '도폐사원인분포(1년)' },
  shipmentAnalysis: { title: '출하자료분석' },
  carcassChart: { title: '도체중/등지방분포' },
};

interface ChartModalProps {
  chartType: ChartType | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 통합 차트 모달 컴포넌트
 * - chartType에 따라 해당 차트를 렌더링
 * - Backend API에서 데이터 조회
 */
export default function ChartModal({ chartType, isOpen, onClose }: ChartModalProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 차트 데이터 조회
  useEffect(() => {
    if (!chartType || !isOpen) {
      setChartData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await weeklyApi.getChartData(chartType);
        setChartData(data);
      } catch (err) {
        setError('데이터를 불러올 수 없습니다.');
        console.error('Chart data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [chartType, isOpen]);

  if (!chartType || !isOpen) return null;

  const config = chartConfigs[chartType];

  /**
   * 차트 타입별 렌더링
   */
  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      );
    }

    if (error || !chartData) {
      return <div className="text-center text-gray-500 py-10">{error || '데이터가 없습니다.'}</div>;
    }

    switch (chartType) {
      // 1. 산차별 모돈현황 (배열 데이터)
      case 'sowChart':
        return (
          <BarChart
            xData={chartData.map((p: any) => p.parity)}
            series={[{ name: '두수', data: chartData.map((p: any) => p.count) }]}
            itemColors={PARITY_COLORS}
            height={300}
          />
        );

      // 2. 재귀일별 교배복수
      case 'matingChart':
        return (
          <BarChart
            xData={chartData.xData}
            series={[{ name: '교배복수', data: chartData.data }]}
            itemColors={GRADIENT_TEAL_BLUE}
            height={300}
          />
        );

      // 3. 산차별 재귀일
      case 'parityReturn':
        return (
          <BarChart
            xData={chartData.xData}
            series={[{ name: '재귀일', data: chartData.data }]}
            itemColors={PARITY_COLORS}
            height={300}
          />
        );

      // 4. 임신일별 사고복수
      case 'accidentPeriod':
        return (
          <BarChart
            xData={chartData.xData}
            series={[{ name: '사고두수', data: chartData.data, color: '#dc3545' }]}
            height={300}
          />
        );

      // 5. 산차별 사고원인
      case 'parityAccident':
        return (
          <BarChart
            xData={chartData.xData}
            series={chartData.series}
            height={300}
          />
        );

      // 6. 산차별 분만성적
      case 'parityBirth':
        return (
          <BarChart
            xData={chartData.xData}
            series={chartData.series}
            height={300}
          />
        );

      // 7. 산차별 이유성적
      case 'parityWean':
        return (
          <BarChart
            xData={chartData.xData}
            series={chartData.series}
            height={300}
          />
        );

      // 8. 도폐사원인분포 (배열 데이터)
      case 'cullingChart':
        return (
          <BarChart
            xData={chartData.map((r: any) => r.name)}
            series={[{ name: '두수', data: chartData.map((r: any) => r.value), color: '#dc3545' }]}
            height={300}
          />
        );

      // 9. 출하자료분석
      case 'shipmentAnalysis':
        return (
          <BarChart
            xData={chartData.xData}
            series={[{ name: '출하두수', data: chartData.data }]}
            height={300}
          />
        );

      // 10. 도체중/등지방분포 (배열 데이터)
      case 'carcassChart':
        return (
          <PieChart
            data={chartData}
            height={300}
          />
        );

      default:
        return <div className="text-center text-gray-500 py-10">차트를 찾을 수 없습니다.</div>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={config.title}
      subtitle={config.subtitle}
      size="lg"
    >
      <div className="h-80">
        {renderChart()}
      </div>
    </Modal>
  );
}
