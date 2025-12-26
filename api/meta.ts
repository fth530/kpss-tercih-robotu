import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

let qualifications: any[] = [];
let positions: any[] = [];
let dataLoaded = false;

function loadData() {
  if (dataLoaded) return;
  
  const possiblePaths = [
    path.join(process.cwd(), "parsed_data"),
    path.join(__dirname, "..", "parsed_data"),
  ];
  
  let foundPath = "";
  for (const basePath of possiblePaths) {
    const qPath = path.join(basePath, "qualifications.json");
    if (fs.existsSync(qPath)) {
      foundPath = basePath;
      break;
    }
  }
  
  if (!foundPath) {
    throw new Error("Data files not found");
  }
  
  qualifications = JSON.parse(
    fs.readFileSync(path.join(foundPath, "qualifications.json"), "utf-8")
  );
  positions = JSON.parse(
    fs.readFileSync(path.join(foundPath, "positions.json"), "utf-8")
  );
  
  dataLoaded = true;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    loadData();
    
    const cities = Array.from(new Set(positions.map((p: any) => p.city))).sort();
    const educationLevels = Array.from(new Set(positions.map((p: any) => p.educationLevel))).sort();
    
    res.status(200).json({
      cities,
      educationLevels,
      qualifications: qualifications.map((q: any) => ({
        code: q.code,
        description: q.description,
        educationLevel: q.educationLevel
      }))
    });
  } catch (error: any) {
    console.error("Meta error:", error);
    res.status(500).json({ message: error.message });
  }
}
