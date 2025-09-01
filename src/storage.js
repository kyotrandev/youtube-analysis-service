import fs from "fs";
import path from "path";

const resultDir = "data/results";
if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });

export function saveResult(id, data) {
    fs.writeFileSync(path.join(resultDir, `${id}.json`), JSON.stringify(data, null, 2));
}

export function loadResult(id) {
    const filePath = path.join(resultDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
