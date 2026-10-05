import * as fs from 'fs/promises';
export async function loadFileJSON(path: string) {
  const rawData = await fs.readFile(path, 'utf-8');
  const parsed = JSON.parse(rawData) as object;

  return parsed;
}
