import React from "react";

export default function SplitSelector({ splits, selectedSplits, onSelectSplits }) {
  const handleChange = (e) => {
    const values = Array.from(e.target.selectedOptions, (option) => option.value);
    onSelectSplits(values);
  };

  return (
    <div className="my-4">
      <label className="block mb-2 text-sm font-medium text-gray-700">Select Split(s):</label>
      <select
        multiple
        value={selectedSplits}
        onChange={handleChange}
        className="block w-full border border-gray-300 rounded-md p-2"
      >
        {splits.map((split) => (
          <option key={split} value={split}>
            {split.replace("split_", "").replace("_", "% Train / ") + "% Test"}
          </option>
        ))}
      </select>
    </div>
  );
}
