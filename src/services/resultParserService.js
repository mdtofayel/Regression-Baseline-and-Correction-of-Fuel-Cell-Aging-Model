import axios from "axios";

export async function fetchAutoParsedRmse(folderName, datasetName) {
  const res = await axios.get(
    `/showResult/autoParsedRmse/${folderName}/${datasetName}`,
    { withCredentials: true }
  );
  return res.data;
}

