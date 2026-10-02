import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const DOCTORS_FILE = path.resolve(process.cwd(), '../shared/doctors.json');

function readLocalDoctors(): any[] {
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

function writeLocalDoctors(data: any[]) {
  try {
    fs.mkdirSync(path.dirname(DOCTORS_FILE), { recursive: true });
    fs.writeFileSync(DOCTORS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing doctors file:', err);
  }
}

function mapSupabaseDoctor(row: any) {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    qualification: row.qualification || 'MBBS',
    experienceYears: row.experience_years || 5,
    rating: Number(row.rating || 5.0),
    reviewCount: row.review_count || 10,
    consultationFee: Number(row.consultation_fee || row.video_fee || 500),
    videoFee: Number(row.video_fee || row.consultation_fee || 500),
    audioFee: Number(row.audio_fee || 300),
    chatFee: Number(row.chat_fee || 200),
    isLiveNow: Boolean(row.is_live_now),
    imageUrl: row.image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    languages: Array.isArray(row.languages) ? row.languages : ['English', 'Hindi'],
    hospital: row.hospital || 'Medco Health Network',
    nextAvailableSlot: row.next_available_slot || 'Available Now',
    about: row.about || '',
    phone: row.phone || '',
    email: row.email || '',
    status: row.status || 'active',
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const liveOnly = searchParams.get('liveOnly') === 'true';
  const specialty = searchParams.get('specialty');

  let doctors: any[] = [];
  try {
    let query = supabase.from('doctors').select('*');
    if (liveOnly) {
      query = query.eq('is_live_now', true);
    }
    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      doctors = data.map(mapSupabaseDoctor);
    }
  } catch (err) {
    console.warn('Supabase doctors query fallback to local:', err);
  }

  // Merge or fallback to local file
  const localDocs = readLocalDoctors();
  if (doctors.length === 0 && localDocs.length > 0) {
    doctors = localDocs;
  } else if (localDocs.length > 0) {
    localDocs.forEach((loc) => {
      if (!doctors.some((d) => d.id === loc.id)) {
        doctors.push(loc);
      }
    });
  }

  if (liveOnly) {
    doctors = doctors.filter((d: any) => d.isLiveNow === true);
  }

  if (specialty && specialty !== 'All') {
    doctors = doctors.filter((d: any) =>
      d.specialty?.toLowerCase().includes(specialty.toLowerCase())
    );
  }

  return NextResponse.json({
    success: true,
    data: doctors,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Upsert into Supabase
    try {
      await supabase.from('doctors').upsert({
        id: body.id,
        name: body.name,
        specialty: body.specialty,
        qualification: body.qualification,
        experience_years: body.experienceYears,
        rating: body.rating,
        review_count: body.reviewCount,
        consultation_fee: body.consultationFee || body.videoFee,
        video_fee: body.videoFee || body.consultationFee,
        audio_fee: body.audioFee,
        chat_fee: body.chatFee,
        is_live_now: body.isLiveNow ?? true,
        image_url: body.imageUrl,
        languages: body.languages,
        hospital: body.hospital,
        next_available_slot: body.nextAvailableSlot,
        about: body.about,
        phone: body.phone,
        email: body.email,
        council_reg_no: body.councilRegNo,
        status: body.status || 'active',
      });
    } catch (supErr) {
      console.warn('Could not upsert doctor in Supabase:', supErr);
    }

    // Update local file
    const doctors = readLocalDoctors();
    const existingIdx = doctors.findIndex((d: any) => d.id === body.id);
    if (existingIdx >= 0) {
      doctors[existingIdx] = { ...doctors[existingIdx], ...body };
    } else {
      doctors.push(body);
    }

    writeLocalDoctors(doctors);

    return NextResponse.json({
      success: true,
      data: body,
      message: 'Doctor saved successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
