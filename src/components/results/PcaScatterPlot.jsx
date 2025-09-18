// src/components/results/PcaScatterPlot.jsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { PCA } from "ml-pca"; 


export default function PcaScatterPlot({ data }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // 🧪 Extract feature matrix
    const featureKeys = Object.keys(data[0]).filter((k) => k.startsWith("feature_"));
    if (featureKeys.length === 0) {
      console.warn("⚠️ No feature_ columns found in normalizedResults");
      return;
    }

    const matrix = data.map((d) =>
      featureKeys.map((k) => {
        const val = parseFloat(d[k]);
        return isNaN(val) ? 0 : val; // fallback for safety
      })
    );

    if (matrix.length === 0 || matrix[0].length === 0) {
      console.warn("⚠️ PCA matrix is empty or improperly formed.");
      return;
    }

    const pca = new PCA(matrix);
    const transformed = pca.predict(matrix);

    const points = transformed.map((d, i) => ({
      x: d[0],
      y: d[1],
      model: data[i].model,
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 500,
      height = 400,
      margin = 40;

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(points, (d) => d.x))
      .range([margin, width - margin]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(points, (d) => d.y))
      .range([height - margin, margin]);

    svg.attr("width", width).attr("height", height);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin})`)
      .call(d3.axisBottom(xScale));

    svg
      .append("g")
      .attr("transform", `translate(${margin},0)`)
      .call(d3.axisLeft(yScale));

    svg
      .selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 5)
      .attr("fill", "#1f77b4");
  }, [data]);

  return (
    <div>
      <h3 className="font-semibold mb-2">🧠 PCA Scatter Plot</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
