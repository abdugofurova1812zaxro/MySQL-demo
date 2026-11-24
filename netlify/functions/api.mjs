import mysql from 'mysql2/promise';

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 4000),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME || 'test',
      ssl: { minVersion: 'TLSv1.2' },
      connectionLimit: 3,
    });
  }
  return pool;
}

export default async (req) => {
  const url = new URL(req.url);
  if (!url.pathname.endsWith('/notes')) {
    return Response.json({ error: 'Topilmadi' }, { status: 404 });
  }

  try {
    const db = getPool();

    if (req.method === 'GET') {
      const [rows] = await db.query(
        'SELECT id, name, created_at FROM notes ORDER BY id DESC LIMIT 100'
      );
      return Response.json(rows);
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const name = String(body.name || '').trim().slice(0, 100);
      if (!name) {
        return Response.json({ error: 'Ism kiritilmadi' }, { status: 400 });
      }
      await db.execute('INSERT INTO notes (name) VALUES (?)', [name]);
      return Response.json({ ok: true }, { status: 201 });
    }

    return Response.json({ error: 'Ruxsat etilmagan metod' }, { status: 405 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
