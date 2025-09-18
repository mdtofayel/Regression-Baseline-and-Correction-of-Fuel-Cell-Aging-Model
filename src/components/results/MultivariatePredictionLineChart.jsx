// src/components/results/MultivariatePredictionLineChart.jsx
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function MultivariatePredictionLineChart({ yTest, modelResults, splitName }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!yTest || yTest.length === 0 || !modelResults || modelResults.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get ground truth values
    const yTrue = yTest.map(row => parseFloat(Object.values(row)[0])); // assume single target column

    // X Scale (time/index)
    const x = d3.scaleLinear()
      .domain([0, yTrue.length - 1])
      .range([0, width]);

    // Y Scale (RMSE range)
    const allValues = [...yTrue];
    modelResults.forEach(m => {
      try {
        const preds = JSON.parse(m.predictions);
        allValues.push(...preds.map(parseFloat));
      } catch {}
    });

    const y = d3.scaleLinear()
      .domain(d3.extent(allValues))
      .range([height, 0]);

    // Axes
    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
    g.append("g").call(d3.axisLeft(y));

    // Ground Truth Line
    g.append("path")
      .datum(yTrue)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1.5)
      .attr("d", d3.line().x((d, i) => x(i)).y(d => y(d)));

    // Model Prediction Lines
    const colors = d3.schemeCategory10;
    modelResults.forEach((model, i) => {
      let preds;
      try {
        preds = JSON.parse(model.predictions).map(parseFloat);
      } catch {
        return;
      }

      g.append("path")
        .datum(preds)
        .attr("fill", "none")
        .attr("stroke", colors[i % colors.length])
        .attr("stroke-width", 1.5)
        .attr("d", d3.line().x((d, i) => x(i)).y(d => y(d)));

      // Add model label
      g.append("text")
        .attr("x", width - 60)
        .attr("y", 20 + i * 20)
        .attr("fill", colors[i % colors.length])
        .text(model.model)
        .style("font-size", "12px");
    });

  }, [yTest, modelResults, splitName]);

  return (
    <div className="my-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">
        📈 Prediction Comparison – {splitName}
      </h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
