
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { category, report } = req.body;

    if (!category || !report) {
      return res.status(400).json({ message: 'Category and report are required' });
    }

    const timestamp = new Date().toISOString();
    const feedback = `[${timestamp}] [${category.toUpperCase()}]: ${report}\n`;

    const filePath = path.join(process.cwd(), 'bug-reports.txt');

    try {
      fs.appendFileSync(filePath, feedback);
      res.status(200).json({ message: 'Feedback saved successfully' });
    } catch (error) {
      console.error('Error saving feedback:', error);
      res.status(500).json({ message: 'Error saving feedback' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
