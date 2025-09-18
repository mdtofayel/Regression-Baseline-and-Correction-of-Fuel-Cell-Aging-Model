import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function PredictionLineChart({ sample }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!sample || sample.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500, height = 300, margin = 40;

    const xScale = d3.scaleLinear()
      .domain([0, sample.length - 1])
      .range([margin, width - margin]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(sample))
      .range([height - margin, margin]);

    svg.attr("width", width).attr("height", height);

    const line = d3.line()
      .x((d, i) => xScale(i))
      .y(d => yScale(d));

    svg.append("path")
      .datum(sample)
      .attr("fill", "none")
      .attr("stroke", "#ef476f")
      .attr("stroke-width", 2)
      .attr("d", line);

  }, [sample]);

  return (
    <div>
      <h3 className="font-semibold mb-2">Sample Feature Line</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
