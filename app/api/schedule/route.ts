import { NextResponse } from 'next/server';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export async function GET(request: Request) {
  try {
    const pdfUrl = 'https://cloud.nntc.nnov.ru/index.php/s/fYpXD39YccFB5gM/download/%D1%81%D0%B0%D0%B9%D1%82%20zameny2022-2023dist.pdf';
    const pdfResponse = await fetch(pdfUrl);
    
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdf(buffer);
    const text = data.text;
    
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
    
    const schedulesByGroup: Record<string, any[]> = {};
    const schedulesByTeacher: Record<string, any[]> = {};
    const groupsSet = new Set<string>();
    const teachersSet = new Set<string>();
    
    let currentDay = '';
    let currentDayOfWeek = '';
    let currentGroup = '';
    let groupLines: string[] = [];
    
    const daysOfWeek = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
    
    const processGroupLines = (group: string, day: string, dayOfWeek: string, linesToProcess: string[]) => {
      if (linesToProcess.length === 0) return;
      
      const lessons: any[] = [];
      const regex = /^([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.[А-ЯЁ]\.(?:\/[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.[А-ЯЁ]\.)?|нет)(.+?)?(\d)(.*)$/;
      
      let pendingSubject = '';
      let pendingRoom = '';
      
      for (let i = 0; i < linesToProcess.length; i++) {
        const line = linesToProcess[i];
        
        const match = line.match(regex);
        if (match) {
          let prof = match[1].trim();
          let subj = (match[2] || '').trim();
          let pair = parseInt(match[3], 10);
          let room = match[4].trim();
          
          if (!subj && pendingSubject) {
            subj = pendingSubject;
            pendingSubject = '';
          }
          if (!room && pendingRoom) {
            room = pendingRoom;
            pendingRoom = '';
          }
          
          if (!subj && i > 0 && !linesToProcess[i-1].match(regex) && !linesToProcess[i-1].match(/^\d+$/)) {
            subj = linesToProcess[i-1];
          }
          if (!room && i < linesToProcess.length - 1 && linesToProcess[i+1].match(/^\d{3,4}[а-яА-Я()\/]*$/)) {
            room = linesToProcess[i+1];
          }
          
          if (prof !== 'нет') {
            lessons.push({
              pair,
              subject: subj || 'Дисциплина',
              professor: prof,
              room: room
            });
          }
        } else {
          if (!line.match(/^\d+$/)) {
             pendingSubject = line;
          } else if (line.match(/^\d{3,4}/)) {
             pendingRoom = line;
          }
        }
      }
      
      if (lessons.length > 0) {
        if (!schedulesByGroup[group]) schedulesByGroup[group] = [];
        schedulesByGroup[group].push({
          date: day,
          dayOfWeek: dayOfWeek,
          lessons: lessons.sort((a, b) => a.pair - b.pair)
        });

        lessons.forEach(lesson => {
          const profs = lesson.professor.split('/').map((p: string) => p.trim()).filter((p: string) => p && p.toLowerCase() !== 'нет');
          profs.forEach((prof: string) => {
            teachersSet.add(prof);
            if (!schedulesByTeacher[prof]) schedulesByTeacher[prof] = [];
            let teacherDay = schedulesByTeacher[prof].find(d => d.date === day);
            if (!teacherDay) {
              teacherDay = { date: day, dayOfWeek: dayOfWeek, lessons: [] };
              schedulesByTeacher[prof].push(teacherDay);
            }
            // Avoid duplicates if same pair is processed twice somehow
            if (!teacherDay.lessons.find((l: any) => l.pair === lesson.pair && l.group === group)) {
              teacherDay.lessons.push({
                pair: lesson.pair,
                subject: lesson.subject,
                group: group,
                room: lesson.room
              });
            }
            teacherDay.lessons.sort((a: any, b: any) => a.pair - b.pair);
          });
        });
      }
    };
    
    const flushGroup = () => {
      if (currentGroup && groupLines.length > 0) {
        groupsSet.add(currentGroup);
        processGroupLines(currentGroup, currentDay, currentDayOfWeek, groupLines);
        groupLines = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      const lowerLine = line.toLowerCase();
      const foundDay = daysOfWeek.find(d => lowerLine.startsWith(d));
      if (foundDay) {
        flushGroup();
        currentDay = line;
        currentDayOfWeek = foundDay;
        currentGroup = '';
        continue;
      }
      
      if (/^[1-5][А-ЯЁ]+-\d{2}-\d[а-я]?$/i.test(line) || /^[1-5][А-ЯЁ]+-\d{2}-\d[а-я]?к$/i.test(line) || /^[1-5][А-ЯЁ]+-\d{2}-\d[а-я]?с$/i.test(line)) {
        flushGroup();
        currentGroup = line.replace(/к$/, '-к').replace(/с$/, '-с');
        currentGroup = line;
        continue;
      }
      
      if (currentGroup) {
        groupLines.push(line);
      }
    }
    flushGroup();

    const callSchedule = {
      monday: [
        { pair: 1, startTime: '09:00', endTime: '10:30' },
        { pair: 2, startTime: '11:00', endTime: '12:30' },
        { pair: 3, startTime: '12:40', endTime: '14:10' },
        { pair: 4, startTime: '14:20', endTime: '15:50' },
        { pair: 5, startTime: '16:00', endTime: '17:30' },
        { pair: 6, startTime: '17:40', endTime: '19:10' }
      ],
      tuesdayToFriday: [
        { pair: 1, startTime: '08:10', endTime: '09:40' },
        { pair: 2, startTime: '09:50', endTime: '11:20' },
        { pair: 3, startTime: '11:50', endTime: '13:20' },
        { pair: 4, startTime: '13:30', endTime: '15:00' },
        { pair: 5, startTime: '15:10', endTime: '16:40' },
        { pair: 6, startTime: '16:50', endTime: '18:20' },
        { pair: 7, startTime: '18:30', endTime: '20:00' }
      ],
      saturday: [
        { pair: 1, startTime: '08:10', endTime: '09:40' },
        { pair: 2, startTime: '09:50', endTime: '11:20' },
        { pair: 3, startTime: '11:30', endTime: '13:00' },
        { pair: 4, startTime: '13:10', endTime: '14:40' },
        { pair: 5, startTime: '14:50', endTime: '16:20' },
        { pair: 6, startTime: '16:30', endTime: '18:00' }
      ]
    };

    return NextResponse.json({
      groups: Array.from(groupsSet).sort(),
      teachers: Array.from(teachersSet).sort(),
      schedulesByGroup,
      schedulesByTeacher,
      callSchedule
    });

  } catch (error: any) {
    console.error('Error fetching/parsing schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
