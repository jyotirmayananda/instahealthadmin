import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';

const PRICING_FILE = path.resolve(process.cwd(), '../shared/consultation-pricing.json');

const DEFAULT_PRICING = {
  videoFee: 499,
  audioFee: 299,
  chatFee: 149,
  currency: 'INR',
  currencySymbol: '₹',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Admin Board',
};

function readLocalPricing() {
  try {
    if (fs.existsSync(PRICING_FILE)) {
      const content = fs.readFileSync(PRICING_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading pricing file:', err);
  }
  return DEFAULT_PRICING;
}

function writeLocalPricing(data: any) {
  try {
    fs.mkdirSync(path.dirname(PRICING_FILE), { recursive: true });
    fs.writeFileSync(PRICING_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing pricing file:', err);
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('consultation_pricing')
      .select('*')
      .eq('id', 'default')
      .single();

    if (!error && data) {
      const pricing = {
        videoFee: Number(data.video_fee || 499),
        audioFee: Number(data.audio_fee || 299),
        chatFee: Number(data.chat_fee || 149),
        currency: data.currency || 'INR',
        currencySymbol: data.currency_symbol || '₹',
        updatedAt: data.updated_at || new Date().toISOString(),
        updatedBy: data.updated_by || 'Admin Board',
      };
      // Keep local in sync
      writeLocalPricing(pricing);
      return NextResponse.json({
        success: true,
        data: pricing,
      });
    }
  } catch (err) {
    console.warn('Supabase consultation_pricing GET fallback to local:', err);
  }

  const pricing = readLocalPricing();
  return NextResponse.json({
    success: true,
    data: pricing,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readLocalPricing();

    const updated = {
      ...current,
      videoFee: Number(body.videoFee) || current.videoFee,
      audioFee: Number(body.audioFee) || current.audioFee,
      chatFee: Number(body.chatFee) || current.chatFee,
      updatedAt: new Date().toISOString(),
      updatedBy: body.updatedBy || 'Central Admin',
    };

    // Update Supabase
    try {
      await supabase.from('consultation_pricing').upsert({
        id: 'default',
        video_fee: updated.videoFee,
        audio_fee: updated.audioFee,
        chat_fee: updated.chatFee,
        currency: updated.currency,
        currency_symbol: updated.currencySymbol,
        updated_at: updated.updatedAt,
        updated_by: updated.updatedBy,
      });
    } catch (supErr) {
      console.warn('Supabase consultation_pricing update failed:', supErr);
    }

    writeLocalPricing(updated);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Consultation pricing updated successfully',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update pricing' },
      { status: 500 }
    );
  }
}
