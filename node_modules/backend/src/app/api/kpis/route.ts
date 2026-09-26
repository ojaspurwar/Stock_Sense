import { NextResponse } from 'next/server';
import { getDashboardKPIs } from '../../../../../Database/src';

export async function GET() {
  try {
    const kpis = await getDashboardKPIs();
    return NextResponse.json(kpis);
  } catch (error: any) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
