import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOCTORS_FILE = path.resolve(process.cwd(), '../shared/doctors.json');

function readDoctors(): any[] {
  try {
    if (fs.existsSync(DOCTORS_FILE)) {
      const content = fs.readFileSync(DOCTORS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading doctors file:', err);
  }
  return [];
}

function writeDoctors(data: any[]) {
  try {
    fs.mkdirSync(path.dirname(DOCTORS_FILE), { recursive: true });
    fs.writeFileSync(DOCTORS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing doctors file:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doctorId, isLiveNow } = body;

    const doctors = readDoctors();
    let updatedDoctor: any = null;

    for (let i = 0; i < doctors.length; i++) {
      if (doctors[i].id === doctorId || doctors[i].name?.toLowerCase() === doctorId?.toLowerCase()) {
        doctors[i].isLiveNow = Boolean(isLiveNow);
        doctors[i].nextAvailableSlot = isLiveNow ? 'Available Now (Instant)' : 'Offline';
        updatedDoctor = doctors[i];
        break;
      }
    }

    if (!updatedDoctor) {
      // If doctor not found by exact ID, update first doctor or add flag
      if (doctors.length > 0) {
        doctors[0].isLiveNow = Boolean(isLiveNow);
        doctors[0].nextAvailableSlot = isLiveNow ? 'Available Now (Instant)' : 'Offline';
        updatedDoctor = doctors[0];
      }
    }

    writeDoctors(doctors);

    return NextResponse.json({
      success: true,
      data: updatedDoctor,
      message: `Doctor status updated to ${isLiveNow ? 'LIVE' : 'OFFLINE'}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
