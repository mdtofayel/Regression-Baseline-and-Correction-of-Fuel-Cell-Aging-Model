import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function ParallelCoordinatesPlot({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const features = Object.keys(data[0]).filter(k => k.startsWith("feature_"));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 600, height = 300, margin = 40;

    const yScales = {};
    features.forEach(f => {
      yScales[f] = d3.scaleLinear()
        .domain(d3.extent(data, d => +d[f]))
        .range([height - margin, margin]);
    });

    const xScale = d3.scalePoint()
      .domain(features)
      .range([margin, width - margin]);

    svg.attr("width", width).attr("height", height);

    // Draw lines
    svg.selectAll("path.line")
      .data(data)
      .enter()
      .append("path")
      .attr("class", "line")
      .attr("d", d =>
        d3.line()(features.map(f => [xScale(f), yScales[f](+d[f])]))
      )
      .attr("fill", "none")
      .attr("stroke", "#06d6a0")
      .attr("stroke-opacity", 0.4);

    // Draw axes
    features.forEach(f => {
      const axis = d3.axisLeft(yScales[f]);

      svg.append("g")
        .attr("transform", `translate(${xScale(f)}, 0)`)
        .call(axis);

      svg.append("text")
        .attr("x", xScale(f))
        .attr("y", height)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(f);
    });

  }, [data]);

  return (
    <div>
      <h3 className="font-semibold mb-2">Parallel Coordinates Plot</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
