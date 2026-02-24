import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function test() {
  const pdfUrl = 'https://cloud.nntc.nnov.ru/index.php/s/fYpXD39YccFB5gM/download/%D1%81%D0%B0%D0%B9%D1%82%20zameny2022-2023dist.pdf';
  const pdfResponse = await fetch(pdfUrl);
  const arrayBuffer = await pdfResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  const data = await pdf(buffer);
  const text = data.text;
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  const regex = /^([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.[А-ЯЁ]\.(?:\/[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.[А-ЯЁ]\.)?|нет)(.+?)?(\d)(.*)$/;
  
  for (const line of lines.slice(0, 100)) {
    if (/^[1-5][А-ЯЁ]+-\d{2}-\d[а-я]?$/i.test(line)) {
      console.log('--- GROUP', line);
      continue;
    }
    const match = line.match(regex);
    if (match) {
      console.log('MATCH:', match[1], '|', match[2], '|', match[3], '|', match[4]);
    } else {
      console.log('UNMATCHED:', line);
    }
  }
}

test();
