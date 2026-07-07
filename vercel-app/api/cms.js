
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby_T8rt4K-fTe78YTCvom3hY27utazr4yffz0_s-HPUlyCft2NaxPHeRgWO1UEkODAbMQ/exec";
const API_SECRET = "bvc4dItgJSS2FttZrHVAYK214N5OqtReN5vje5SSDmUQDIft";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!SCRIPT_URL) {
    return res.status(500).json({ ok: false, error: 'SCRIPT_URL not configured' });
  }

  try {
    const input = req.body && typeof req.body === 'object' ? req.body : {};
    // Encode as form data — Apps Script parses this into e.parameter reliably
    const form = new URLSearchParams();
    form.set('fn', input.fn || '');
    form.set('args', JSON.stringify(Array.isArray(input.args) ? input.args : []));
    if (API_SECRET) form.set('secret', API_SECRET);

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: form.toString(),
      redirect: 'follow'
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch (_) { data = { ok: false, error: 'Apps Script returned non-JSON: ' + text.slice(0, 200) }; }
    return res.status(response.ok ? 200 : 502).json(data);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
