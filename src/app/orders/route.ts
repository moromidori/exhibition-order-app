import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// データベースの初期化（テーブルがなければ自動作成）
async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS exhibition_orders (
      id SERIAL PRIMARY KEY,
      company_name VARCHAR(255) NOT NULL,
      department VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      zip VARCHAR(20) NOT NULL,
      address TEXT NOT NULL,
      tel VARCHAR(50) NOT NULL,
      notes TEXT,
      items JSONB NOT NULL,
      total_amount INT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

// 注文一覧の取得（管理者用）
export async function GET() {
  try {
    await initDb();
    const { rows } = await sql`
      SELECT * FROM exhibition_orders ORDER BY created_at DESC;
    `;
    return NextResponse.json({ success: true, orders: rows });
  } catch (error: any) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 新規注文の保存
export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { companyName, department, name, email, zip, address, tel, notes, items, totalAmount } = body;

    const result = await sql`
      INSERT INTO exhibition_orders 
        (company_name, department, name, email, zip, address, tel, notes, items, total_amount)
      VALUES 
        (${companyName}, ${department}, ${name}, ${email}, ${zip}, ${address}, ${tel}, ${notes}, ${JSON.stringify(items)}, ${totalAmount})
      RETURNING id, created_at;
    `;

    return NextResponse.json({ success: true, order: result.rows[0] });
  } catch (error: any) {
    console.error('Save order error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}