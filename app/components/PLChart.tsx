
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface PLChartProps {
  strikePrice: number; //行权价格
  premium: number; //期权费
  isCall: boolean; //是否是看涨期权
}

export const PLChart: React.FC<PLChartProps> = ({ strikePrice, premium, isCall }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // 清除之前的图表
    d3.select(svgRef.current).selectAll('*').remove();

    // 设置图表尺寸和边距
    const margin = { top: 30, right: 30, bottom: 30, left: 30 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    //创建SVG容器
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 获取盈亏平衡点
    const breakevenPoint = strikePrice + premium;

    //生成盈亏数据
    const data = Array.from({ length: 1000 }).map((_, i) => {
      const spotPrice = i * 240;
      let pl = (spotPrice - breakevenPoint) * (isCall ? 1 : -1);
      return { spotPrice, pl }
    })
    
    //盈利数据
    const dataProfit = data.filter(i => i.pl > 0)
    //亏损数据
    const dataLoss = data.filter(i => i.pl <= 0).map(i => ({ ...i, pl: Math.max(i.pl, -premium)}))

    //创建比例尺
    const scaleX = d3.scaleLinear()
      .domain([0, 240000])
      .range([0, width]);
    const scaleY = d3.scaleLinear()
      .domain([
        -premium * 2, // 将下限设为最大损失的2倍,让负值部分更明显
        Math.max(d3.max(data, d => d.pl) ?? 0, premium)
      ])
      .range([height, 0]);

    //绘制坐标轴
    svg.append('line')
      .attr('x1', 0)
      .attr('y1', scaleY(0))
      .attr('x2', width)
      .attr('y2', scaleY(0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

    svg.append('line')
      .attr('x1', 0)
      .attr('y1', height)
      .attr('x2', 0) 
      .attr('y2', 0)
      .attr('stroke', 'black')
      .attr('stroke-width', 1);

    //创建线条生成器
    const line = d3.line<{ spotPrice: number; pl: number }>()
    .x(d => scaleX(d.spotPrice))
    .y(d => scaleY(d.pl));

    //绘制损益线
    svg.append('path')
      .datum(dataProfit)
      .attr('fill', 'none')
      .attr('stroke', '#4CAF50')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.append('path')
      .datum(dataLoss)
      .attr('fill', 'none')
      .attr('stroke', '#FF5252')
      .attr('stroke-width', 2)
      .attr('d', line);


    //添加 tooltip
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('padding', '5px')
      .style('border', '1px solid #ddd')
      .style('visibility', 'hidden');

    const tooltipLine = svg.append('line')
      .style('stroke', '#999')
      .style('visibility', 'hidden');


    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const spotPrice = scaleX.invert(mouseX);
        const bisect = d3.bisector((d: { spotPrice: number }) => d.spotPrice).left;
        const index = bisect(data, spotPrice);
        const d = data[index];
        if (!d) return;

        tooltipLine
          .style("visibility", "visible")
          .attr('x1', scaleX(d.spotPrice))
          .attr('y1', 0)
          .attr('x2', scaleX(d.spotPrice))
          .attr('y2', height);


        tooltip
          .style("visibility", "visible")
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`Spot Price: $${d.spotPrice}<br>P/L: $${Math.max(-premium, d.pl)}`);
      })
      .on('mouseleave', function() {
        tooltipLine.style("visibility", "hidden");
        tooltip.style("visibility", "hidden");
      });

  }, [strikePrice, premium]);

  return (
    <>
      <h1>Profit & Loss</h1>
      <svg ref={svgRef} />
    </>
  )
}
