// src/components/results/MultivariateHeatmap.jsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function MultivariateHeatmap({ xTest, splitName }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!xTest || xTest.length === 0 || !Array.isArray(xTest[0])) return;

    const numSamples = xTest.length;
    const numFeatures = xTest[0].length;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const cellSize = 20;
    const width = numFeatures * cellSize;
    const height = numSamples * cellSize;

    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateViridis)
      .domain(d3.extent(xTest.flat()));

    svg
      .attr("width", width + 100)
      .attr("height", height + 60);

    const g = svg.append("g")
      .attr("transform", `translate(60, 20)`);

    g.selectAll("g.row")
      .data(xTest)
      .join("g")
      .attr("class", "row")
      .attr("transform", (_, i) => `translate(0, ${i * cellSize})`)
      .each(function (rowData) {
        d3.select(this).selectAll("rect")
          .data(rowData)
          .join("rect")
          .attr("x", (_, j) => j * cellSize)
          .attr("width", cellSize)
          .attr("height", cellSize)
          .attr("fill", d => colorScale(d));
      });

    // Axes Labels
    g.append("text")
      .attr("x", 0)
      .attr("y", -5)
      .text(`🟩 Heatmap for ${splitName}`)
      .style("font-weight", "bold")
      .style("fill", "#333");

  }, [xTest, splitName]);

  return (
        <div className="my-4">
            <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: "4px" }}>
            <svg ref={svgRef}></svg>
            </div>
        </div>
    );

}
