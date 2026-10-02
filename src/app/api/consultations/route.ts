import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const CONSULTATIONS_FILE = path.resolve(process.cwd(), '../shared/consultations.json');

function readLocalConsultations(): any[] {
  try {
    if (fs.existsSync(CONSULTATIONS_FILE)) {
      const content = fs.readFileSync(CONSULTATIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading consultations file:', err);
  }
  return [];
}

function writeLocalConsultations(data: any[]) {
  try {
    fs.mkdirSync(path.dirname(CONSULTATIONS_FILE), { recursive: true });
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing consultations file:', err);
  }
}

function mapSupabaseToApp(row: any) {
  return {
    id: row.id,
    doctorId: row.doctor_id || 'doc1',
    doctorName: row.doctor_name || 'Dr. Rajesh Verma',
    doctorSpecialty: row.doctor_specialty || 'General Physician',
    doctorImageUrl: row.doctor_image_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
    patientName: row.patient_name || 'Patient',
    patientPhone: row.patient_phone || '+91 82490 23875',
    patientAge: row.patient_age || 30,
    symptoms: row.symptoms || 'General concern',
    type: row.type || 'video',
    status: row.status || 'waiting_doctor',
    fee: Number(row.fee || 499),
    createdAt: row.created_at || new Date().toISOString(),
    doctorJoined: Boolean(row.doctor_joined),
    prescription: row.prescription_summary || undefined,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const doctorId = searchParams.get('doctorId');

  let items: any[] = [];
  try {
    let query = supabase.from('consultations').select('*').order('created_at', { ascending: false });
    if (id) {
      query = query.eq('id', id);
    }
    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      items = data.map(mapSupabaseToApp);
    }
  } catch (err) {
    console.warn('Supabase fetch failed in /api/consultations, falling back to local file:', err);
  }

  // Merge or fallback
  const localList = readLocalConsultations();
  if (items.length === 0 && localList.length > 0) {
    items = localList;
  } else if (localList.length > 0) {
    localList.forEach((local) => {
      if (!items.some((it) => it.id === local.id)) {
        items.push(local);
      }
    });
  }

  if (id) {
    const found = items.find((c: any) => c.id === id);
    if (found) {
      return NextResponse.json({ success: true, data: found });
    }
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  }

  let filtered = items;
  if (doctorId) {
    filtered = filtered.filter((c: any) => c.doctorId === doctorId);
  }

  return NextResponse.json({
    success: true,
    data: filtered,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const newConsultation = {
      id: body.id || `CONS-${Date.now().toString().slice(-4)}`,
      doctorId: body.doctorId || 'doc1',
      doctorName: body.doctorName || 'Dr. Rajesh Verma',
      doctorSpecialty: body.doctorSpecialty || 'General Physician',
      doctorImageUrl: body.doctorImageUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
      patientName: body.patientName || 'Patient',
      patientPhone: body.patientPhone || body.phone || '+91 82490 23875',
      patientAge: body.patientAge || 30,
      symptoms: body.symptoms || 'General concern',
      type: body.type || 'video',
      status: body.status || 'waiting_doctor',
      fee: Number(body.fee) || 499,
      createdAt: new Date().toISOString(),
      doctorJoined: false,
    };

    // Save to Supabase
    try {
      await supabase.from('consultations').upsert({
        id: newConsultation.id,
        doctor_id: newConsultation.doctorId,
        doctor_name: newConsultation.doctorName,
        doctor_specialty: newConsultation.doctorSpecialty,
        doctor_image_url: newConsultation.doctorImageUrl,
        patient_name: newConsultation.patientName,
        patient_phone: newConsultation.patientPhone,
        patient_age: newConsultation.patientAge,
        symptoms: newConsultation.symptoms,
        type: newConsultation.type,
        status: newConsultation.status,
        fee: newConsultation.fee,
        doctor_joined: false,
        created_at: newConsultation.createdAt,
      });
    } catch (supErr) {
      console.warn('Could not insert consultation to Supabase:', supErr);
    }

    // Save to local file
    const items = readLocalConsultations();
    items.unshift(newConsultation);
    writeLocalConsultations(items);

    return NextResponse.json({
      success: true,
      data: newConsultation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, doctorJoined, prescription } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Consultation id required' }, { status: 400 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (status) updatePayload.status = status;
    if (typeof doctorJoined === 'boolean') updatePayload.doctor_joined = doctorJoined;
    if (prescription) updatePayload.prescription_summary = prescription;

    // Update Supabase
    try {
      await supabase.from('consultations').update(updatePayload).eq('id', id);
    } catch (supErr) {
      console.warn('Could not update Supabase consultation:', supErr);
    }

    // Update local file
    const items = readLocalConsultations();
    const idx = items.findIndex((c: any) => c.id === id);

    let updatedItem: any = null;
    if (idx !== -1) {
      if (status) items[idx].status = status;
      if (typeof doctorJoined === 'boolean') items[idx].doctorJoined = doctorJoined;
      if (prescription) items[idx].prescription = prescription;
      updatedItem = items[idx];
      writeLocalConsultations(items);
    } else {
      updatedItem = { id, status, doctorJoined, prescription };
    }

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
