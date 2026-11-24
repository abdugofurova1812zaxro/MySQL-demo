import mysql from 'mysql2/promise';

let conn = null;
async function getConn() {
  if (!conn) {
    conn = await mysql.createConnection({
      host: Netlify.env.get('DB_HOST'),
      port: Number(Netlify.env.get('DB_PORT')),
      user: Netlify.env.get('DB_USER'),
      password: Netlify.env.get('DB_PASS'),
      database: Netlify.env.get('DB_NAME'),
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });
  }
  return conn;
}

const handler = async () => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    body = {};
  }

  const db = await getConn();

  if (event.httpMethod === 'POST') {
    const name = (body.name || '').toString().slice(0, 100).trim();
    if (!name) {
      return { statusCode: 400, body: JSON.stringify({ error: 'name required' }) };
    }
    await db.execute('INSERT INTO notes (name) VALUES (?)', [name]);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  const [rows] = await db.execute('SELECT id, name, created_at FROM notes ORDER BY id DESC LIMIT 50');
  return { statusCode: 200, body: JSON.stringify(rows) };
};

export { handler, event };
