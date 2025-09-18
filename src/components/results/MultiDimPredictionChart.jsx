// src/components/results/MultiDimPredictionChart.jsx
import React from "react";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

const MultiDimPredictionChart = ({ splitName, xTestData, yTestData }) => {
  const ref = useRef();

  useEffect(() => {
    if (!xTestData || !yTestData || xTestData.length === 0 || yTestData.length === 0) return;

    // Clear any previous render
    d3.select(ref.current).selectAll("*").remove();

    const width = 900;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 30, left: 50 };

    const svg = d3
      .select(ref.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // Extract dimensions
    const featureKeys = Object.keys(xTestData[0]);

    const dimensions = featureKeys.map((d) => d);
    const yValues = yTestData.map((d) => parseFloat(Object.values(d)[0]));

    // Build x scales for each dimension
    const xScales = dimensions.map((dim) => {
      const extent = d3.extent(xTestData, (d) => +d[dim]);
      return d3.scaleLinear().domain(extent).range([margin.top, height - margin.bottom]);
    });

    // Create scale for dimension placement
    const x = d3.scalePoint().range([margin.left, width - margin.right]).padding(1).domain(dimensions);

    // Line generator
    const line = d3.line().defined(([, value]) => value != null);

    svg
      .append("g")
      .selectAll("path")
      .data(xTestData)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d, i) => d3.interpolateCool(i / xTestData.length))
      .attr("stroke-width", 1.2)
      .attr("d", (d) =>
        line(
          dimensions.map((p, i) => [x(p), xScales[i](+d[p])])
        )
      );

    // Draw axis per dimension
    dimensions.forEach((dim, i) => {
      svg
        .append("g")
        .attr("transform", `translate(${x(dim)},0)`)
        .call(d3.axisLeft(xScales[i]).ticks(4))
        .append("text")
        .attr("y", 10)
        .attr("x", 0)
        .attr("dy", "-1em")
        .attr("text-anchor", "middle")
        .text(dim)
        .style("fill", "#333");
    });

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(`Multidimensional Feature Lines - ${splitName}`);
  }, [xTestData, yTestData, splitName]);

  return <div ref={ref} className="overflow-x-auto"></div>;
};

export default MultiDimPredictionChart;
