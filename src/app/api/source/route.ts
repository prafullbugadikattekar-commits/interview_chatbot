import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  
  let filename = 'InterviewEngine.hpp';
  if (file === 'main') {
    filename = 'main.cpp';
  }

  try {
    const filePath = path.join(process.cwd(), 'cpp_engine', filename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Source file not found' }, { status: 404 });
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return NextResponse.json({ filename, content, lineCount: content.split('\n').length });
  } catch (error) {
    console.error('Failed to read source file:', error);
    return NextResponse.json({ error: 'Failed to read source file' }, { status: 500 });
  }
}
