import type { VercelRequest, VercelResponse } from '@vercel/node';
import qualificationsData from '../parsed_data/qualifications.json';
import positionsData from '../parsed_data/positions.json';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const cities = Array.from(new Set(positionsData.map((p: any) => p.city))).sort();
    const educationLevels = Array.from(new Set(positionsData.map((p: any) => p.educationLevel))).sort();
    
    res.status(200).json({
      cities,
      educationLevels,
      qualifications: qualificationsData.map((q: any) => ({
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
