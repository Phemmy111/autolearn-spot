import { NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_TEST_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function GET() {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Paystack not configured'
      }, { status: 500 });
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || 'Failed to fetch banks');
    }

    const banks = data.data.map((bank: any) => ({
      code: bank.code,
      name: bank.name,
      slug: bank.slug
    }));

    // Add Opay with the correct code if not present
    if (!banks.find((b: any) => b.code === '999992')) {
      banks.push({
        code: '999992',
        name: 'Opay',
        slug: 'opay'
      });
    }

    return NextResponse.json({
      success: true,
      banks
    });
  } catch (error) {
    console.error('Error fetching banks:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch banks from Paystack'
    }, { status: 500 });
  }
}
