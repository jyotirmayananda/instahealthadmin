import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const PRESCRIPTIONS_FILE = path.resolve(process.cwd(), '../shared/prescriptions.json');

function readLocalPrescriptions(): any[] {
  try {
    if (fs.existsSync(PRESCRIPTIONS_FILE)) {
      const content = fs.readFileSync(PRESCRIPTIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading prescriptions file:', err);
  }
  return [];
}

function writeLocalPrescriptions(data: any[]) {
  try {
    fs.mkdirSync(path.dirname(PRESCRIPTIONS_FILE), { recursive: true });
    fs.writeFileSync(PRESCRIPTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing prescriptions file:', err);
  }
}

function mapSupabaseToApp(row: any) {
  return {
    id: row.id,
    patientName: row.patient_name || 'Patient',
    phone: row.patient_phone || '+91 82490 23875',
    patientAge: row.patient_age || 28,
    fileName: row.file_name || 'Prescription.jpg',
    fileUrl: row.file_url || row.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&auto=format&fit=crop&q=80',
    targetRole: row.target_role || 'all',
    targetProviderName: row.target_provider_name || '',
    status: row.status || 'pending',
    notes: row.notes || '',
    uploadedAt: row.created_at || new Date().toISOString(),
    auditNotes: row.audit_notes || undefined,
    verifiedBy: row.verified_by || undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const targetRole = searchParams.get('targetRole') || searchParams.get('role');
    const status = searchParams.get('status');
    const q = searchParams.get('q')?.toLowerCase();

    // 1. Try Supabase
    let items: any[] = [];
    try {
      let query = supabase.from('prescriptions').select('*').order('created_at', { ascending: false });

      if (id) {
        query = query.eq('id', id);
      }
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (targetRole && targetRole !== 'all') {
        query = query.or(`target_role.eq.${targetRole},target_role.eq.all,target_role.is.null`);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        items = data.map(mapSupabaseToApp);
      }
    } catch (err) {
      console.warn('Supabase fetch failed in /api/prescriptions, falling back to local file:', err);
    }

    // Merge or fallback to local file
    const localItems = readLocalPrescriptions();
    if (items.length === 0 && localItems.length > 0) {
      items = localItems;
    } else if (localItems.length > 0) {
      localItems.forEach((local) => {
        if (!items.some((it) => it.id === local.id)) {
          items.push(local);
        }
      });
    }

    if (id) {
      const item = items.find((p: any) => p.id === id);
      if (!item) {
        return NextResponse.json({ success: false, error: 'Prescription not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: item });
    }

    let filtered = items;

    if (targetRole && targetRole !== 'all') {
      filtered = filtered.filter(
        (p: any) => p.targetRole === targetRole || p.targetRole === 'all' || !p.targetRole
      );
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((p: any) => p.status === status);
    }

    if (q) {
      filtered = filtered.filter(
        (p: any) =>
          p.id?.toLowerCase().includes(q) ||
          p.patientName?.toLowerCase().includes(q) ||
          p.fileName?.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newPrescription = {
      id: body.id || `RX-${Date.now().toString().slice(-4)}`,
      patientName: body.patientName || 'Patient',
      phone: body.phone || '+91 82490 23875',
      patientAge: body.patientAge ? Number(body.patientAge) : 28,
      fileName: body.fileName || 'Prescription.jpg',
      fileUrl:
        body.fileUrl ||
        body.uri ||
        body.imageUrl ||
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=900&auto=format&fit=crop&q=80',
      targetRole: body.targetRole || 'all',
      targetProviderName: body.targetProviderName || '',
      status: body.status || 'pending',
      notes: body.notes || '',
      uploadedAt: body.uploadedAt || new Date().toISOString(),
      linkedOrderId: body.linkedOrderId || undefined,
      verifiedBy: body.verifiedBy || undefined,
      auditNotes: body.auditNotes || undefined,
    };

    // Save to Supabase
    try {
      await supabase.from('prescriptions').upsert({
        id: newPrescription.id,
        patient_name: newPrescription.patientName,
        patient_phone: newPrescription.phone,
        patient_age: newPrescription.patientAge,
        file_name: newPrescription.fileName,
        file_url: newPrescription.fileUrl,
        image_url: newPrescription.fileUrl,
        target_role: newPrescription.targetRole,
        target_provider_name: newPrescription.targetProviderName,
        status: newPrescription.status,
        notes: newPrescription.notes,
        audit_notes: newPrescription.auditNotes,
        verified_by: newPrescription.verifiedBy,
        created_at: newPrescription.uploadedAt,
      });
    } catch (supErr) {
      console.warn('Could not insert to Supabase prescriptions:', supErr);
    }

    // Also update local file
    const items = readLocalPrescriptions();
    const existingIdx = items.findIndex((p: any) => p.id === newPrescription.id);
    if (existingIdx >= 0) {
      items[existingIdx] = { ...items[existingIdx], ...newPrescription };
    } else {
      items.unshift(newPrescription);
    }
    writeLocalPrescriptions(items);

    return NextResponse.json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: newPrescription,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, auditNotes, verifiedBy } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Prescription id required' }, { status: 400 });
    }

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (status) updatePayload.status = status;
    if (auditNotes !== undefined) updatePayload.audit_notes = auditNotes;
    if (verifiedBy) updatePayload.verified_by = verifiedBy;

    // Update Supabase
    try {
      await supabase.from('prescriptions').update(updatePayload).eq('id', id);
    } catch (supErr) {
      console.warn('Could not update Supabase prescription:', supErr);
    }

    // Update local file
    const items = readLocalPrescriptions();
    const idx = items.findIndex((p: any) => p.id === id);

    let updatedItem: any = null;
    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        status: status || items[idx].status,
        auditNotes: auditNotes !== undefined ? auditNotes : items[idx].auditNotes,
        verifiedBy: verifiedBy || items[idx].verifiedBy || 'Admin Clinical Auditor',
        updatedAt: new Date().toISOString(),
      };
      updatedItem = items[idx];
      writeLocalPrescriptions(items);
    } else {
      updatedItem = { id, status, auditNotes, verifiedBy };
    }

    return NextResponse.json({
      success: true,
      message: `Prescription status updated to ${status}`,
      data: updatedItem,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
