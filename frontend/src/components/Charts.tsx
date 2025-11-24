import * as echarts from 'echarts';
import React, { useEffect, useRef } from 'react';

interface ChartProps {
  options: echarts.EChartsOption;
  height?: string;
  width?: string;
}

export const BaseChart: React.FC<ChartProps> = ({
  options,
  height = '300px',
  width = '100%',
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    chartInstance.current = echarts.init(chartRef.current);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartInstance.current) return;
    chartInstance.current.setOption(options, { notMerge: true });
  }, [options]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export const RewardsChart: React.FC = () => {
  // Mock data for visualization since we might not have enough historical data yet
  const option: echarts.EChartsOption = {
    title: {
      text: 'Rewards History',
      textStyle: { color: '#ccc' },
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLine: { lineStyle: { color: '#ccc' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#ccc' } },
      splitLine: { lineStyle: { color: '#333' } },
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        smooth: true,
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgb(128, 255, 165)',
            },
            {
              offset: 1,
              color: 'rgb(1, 191, 236)',
            },
          ]),
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    backgroundColor: 'transparent',
  };

  return <BaseChart options={option} />;
};

export const MarketAprChart: React.FC = () => {
  const option: echarts.EChartsOption = {
    title: {
      text: 'Market APR',
      textStyle: { color: '#ccc' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      data: ['BTC', 'ETH', 'SOL', 'US Election', 'Fed Rate'],
      axisLine: { lineStyle: { color: '#ccc' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#ccc' } },
      splitLine: { lineStyle: { color: '#333' } },
    },
    series: [
      {
        data: [120, 200, 150, 80, 70],
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' },
          ]),
        },
      },
    ],
    backgroundColor: 'transparent',
  };

  return <BaseChart options={option} />;
};
