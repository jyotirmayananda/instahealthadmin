import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

// Shared persistence path
const REGISTRATIONS_FILE = path.resolve(process.cwd(), '../shared/registrations.json');

function readLocalRegistrations(): any[] {
  try {
    if (fs.existsSync(REGISTRATIONS_FILE)) {
      const content = fs.readFileSync(REGISTRATIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading registrations file:', err);
  }
  return [];
}

function writeLocalRegistrations(data: any[]) {
  try {
    fs.mkdirSync(path.dirname(REGISTRATIONS_FILE), { recursive: true });
    fs.writeFileSync(REGISTRATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing registrations file:', err);
  }
}

export async function GET() {
  const localList = readLocalRegistrations();

  // Also query Supabase provider_kyc directly
  let supabaseKycList: any[] = [];
  try {
    const { data: kycRows, error } = await supabase
      .from('provider_kyc')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (!error && Array.isArray(kycRows)) {
      supabaseKycList = kycRows.map((row) => ({
        id: row.id,
        role: row.role || 'delivery',
        name: row.name,
        phone: row.phone || '',
        email: row.email || '',
        profilePhoto: row.profile_photo || null,
        councilRegNo: row.council_reg_no || '',
        qualification: row.qualification || '',
        vehicleType: 'Electric Bike',
        vehicleNumber: '',
        zone: 'Central Hub',
        status: row.status === 'verified' ? 'active' : row.status === 'rejected' ? 'rejected' : 'pending_approval',
        submittedAt: row.submitted_at ? new Date(row.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        documents: Array.isArray(row.documents) ? row.documents : ['Identity Document', 'Driving License'],
      }));
    }
  } catch (err) {
    console.warn('Could not query Supabase in registrations GET:', err);
  }

  // Merge unique by id or phone
  const combined = [...localList];
  supabaseKycList.forEach((supItem) => {
    const exists = combined.some(
      (c) => c.id === supItem.id || (c.phone && supItem.phone && c.phone === supItem.phone)
    );
    if (!exists) {
      combined.unshift(supItem);
    }
  });

  return NextResponse.json({ success: true, data: combined });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const localList = readLocalRegistrations();

    const newId = `reg_${body.role || 'delivery'}_${Date.now().toString().slice(-6)}`;
    const newRecord = {
      id: newId,
      role: body.role || 'delivery',
      name: body.name || 'New Delivery Partner',
      phone: body.phone || '',
      email: body.email || '',
      councilRegNo: body.councilRegNo || body.licenseNo || 'DL-PENDING',
      qualification: body.qualification || `${body.vehicleType || 'Electric Bike'} • ${body.vehicleNumber || 'UP-16-EV-9901'}`,
      specialty: body.specialty || '',
      hospital: body.hospital || '',
      videoFee: body.videoFee ? Number(body.videoFee) : 500,
      audioFee: body.audioFee ? Number(body.audioFee) : 300,
      chatFee: body.chatFee ? Number(body.chatFee) : 200,
      consultFee: body.videoFee ? Number(body.videoFee) : (body.consultFee ? Number(body.consultFee) : 500),
      profilePhoto: body.profilePhoto || null,
      aadhaarDoc: body.aadhaarDoc || null,
      councilCert: body.councilCert || null,
      vehicleType: body.vehicleType || 'Electric Bike',
      vehicleNumber: body.vehicleNumber || 'UP-16-EV-9901',
      zone: body.zone || 'Sector 62 / Indirapuram Corridor',
      status: 'pending_approval',
      submittedAt: 'Just now',
      password: body.password || '',
      documents: body.documents || ['Driving License (Smart Card)', 'Vehicle RC Document'],
    };

    localList.unshift(newRecord);
    writeLocalRegistrations(localList);

    // Write to Supabase provider_kyc & fleet_staff
    try {
      await supabase.from('provider_kyc').insert({
        id: newId,
        name: newRecord.name,
        role: newRecord.role,
        phone: newRecord.phone,
        email: newRecord.email,
        council_reg_no: newRecord.councilRegNo,
        qualification: newRecord.qualification,
        profile_photo: newRecord.profilePhoto,
        status: 'pending',
        documents: newRecord.documents,
      });

      if (newRecord.role === 'delivery') {
        await supabase.from('fleet_staff').insert({
          id: `fleet_${newId}`,
          name: newRecord.name,
          role: 'delivery',
          phone: newRecord.phone,
          current_zone: newRecord.zone,
          status: 'pending_approval',
          battery_percent: 100,
          council_reg_no: newRecord.councilRegNo,
          qualification: newRecord.qualification,
          kyc_status: 'pending',
          is_online: false,
        });
      }
    } catch (supErr) {
      console.warn('Could not sync registration to Supabase:', supErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery partner registered successfully. Visible in Admin Dashboard.',
      data: newRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit registration' },
      { status: 400 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, permissions } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Registration ID is required' }, { status: 400 });
    }

    const localList = readLocalRegistrations();
    let updatedRecord: any = null;

    const updated = localList.map((r: any) => {
      if (r.id === id || r.councilRegNo === id || r.phone === id) {
        updatedRecord = {
          ...r,
          status: status !== undefined ? status : r.status,
          verifiedAt: status === 'active' || status === 'verified' ? 'Just now' : r.verifiedAt,
          permissions: permissions ? { ...r.permissions, ...permissions } : r.permissions,
        };
        return updatedRecord;
      }
      return r;
    });

    writeLocalRegistrations(updated);

    // Sync status change to Supabase
    try {
      const kycStatusVal = status === 'active' || status === 'verified' || status === 'available' ? 'verified' : status;
      await supabase
        .from('provider_kyc')
        .update({ status: kycStatusVal })
        .or(`id.eq.${id},council_reg_no.eq.${id},phone.eq.${id}`);

      const fleetStatusVal = status === 'active' || status === 'verified' || status === 'available' ? 'available' : 'offline';
      await supabase
        .from('fleet_staff')
        .update({ status: fleetStatusVal, kyc_status: kycStatusVal })
        .or(`id.eq.${id},council_reg_no.eq.${id},phone.eq.${id}`);
    } catch (supErr) {
      console.warn('Could not update Supabase registration status:', supErr);
    }

    // Sync to shared/doctors.json if doctor approved
    if (updatedRecord && (status === 'active' || status === 'verified') && updatedRecord.role === 'doctor') {
      try {
        const DOCTORS_FILE = path.resolve(process.cwd(), '../shared/doctors.json');
        let docsList: any[] = [];
        if (fs.existsSync(DOCTORS_FILE)) {
          docsList = JSON.parse(fs.readFileSync(DOCTORS_FILE, 'utf-8'));
        }
        const existingIdx = docsList.findIndex(
          (d: any) => d.id === updatedRecord.id || d.name?.toLowerCase() === updatedRecord.name?.toLowerCase()
        );
        const newDocEntry = {
          id: updatedRecord.id,
          name: updatedRecord.name?.startsWith('Dr.') ? updatedRecord.name : `Dr. ${updatedRecord.name}`,
          specialty: updatedRecord.specialty || 'General Physician',
          qualification: updatedRecord.qualification || 'MBBS, MD',
          experienceYears: 7,
          rating: 4.9,
          reviewCount: 15,
          consultationFee: updatedRecord.videoFee || updatedRecord.consultFee || 500,
          videoFee: updatedRecord.videoFee || 500,
          audioFee: updatedRecord.audioFee || 300,
          chatFee: updatedRecord.chatFee || 200,
          isLiveNow: true,
          imageUrl: updatedRecord.profilePhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80',
          languages: ['English', 'Hindi'],
          hospital: updatedRecord.hospital || 'Medco Network Clinic',
          nextAvailableSlot: 'Available Now (Live)',
          about: `Experienced ${updatedRecord.specialty || 'General Physician'} dedicated to patient care and teleconsultations.`,
        };
        if (existingIdx >= 0) {
          docsList[existingIdx] = { ...docsList[existingIdx], ...newDocEntry };
        } else {
          docsList.unshift(newDocEntry);
        }
        fs.mkdirSync(path.dirname(DOCTORS_FILE), { recursive: true });
        fs.writeFileSync(DOCTORS_FILE, JSON.stringify(docsList, null, 2), 'utf-8');
      } catch (docSyncErr) {
        console.warn('Could not sync approved doctor to shared/doctors.json:', docSyncErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Registration status updated to ${status}`,
      data: updatedRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update registration' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Registration ID is required' }, { status: 400 });
    }

    const localList = readLocalRegistrations();
    const filtered = localList.filter((r: any) => r.id !== id && r.councilRegNo !== id);
    writeLocalRegistrations(filtered);

    try {
      await supabase.from('provider_kyc').delete().or(`id.eq.${id},council_reg_no.eq.${id}`);
    } catch (supErr) {
      console.warn('Could not delete from Supabase provider_kyc:', supErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Registration removed successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to remove registration' },
      { status: 400 }
    );
  }
}

