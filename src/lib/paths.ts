import path from "node:path";

export const dataDir = path.join(process.cwd(), "data");
export const audioDir = path.join(dataDir, "audio");
export const databasePath = path.join(dataDir, "doran.db");
