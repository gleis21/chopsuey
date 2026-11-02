// Neue Buchung: Sprache (de|en|es) wird im selben create wie SendAutoMail ins
// Airtable-Feld "Sprache" geschrieben; fehlt das Feld, wird ohne Sprache angelegt.
// Ohne Airtable-Zugang (Airtable gemockt). Aufruf: npm run test:sprache
const assert = require('assert');
const { BookingService } = require('../dist/pkg/services');

const rec = (id, fields) => ({ id, getId: () => id, get: k => fields[k] });

function service(airtableKnowsSprache) {
  const calls = [];
  const base = () => ({
    create: async fields => {
      calls.push({ ...fields });
      if (!airtableKnowsSprache && 'Sprache' in fields) {
        const e = new Error('Unknown field name: "Sprache"');
        e.error = 'UNKNOWN_FIELD_NAME';
        e.statusCode = 422;
        throw e;
      }
      return rec('recNEU', fields);
    }
  });
  const personSrv = { getByEmail: async () => rec('recP', {}), createOrUpdate: async () => rec('recP', {}) };
  return { srv: new BookingService(base, {}, personSrv, {}), calls };
}

const neu = lang => ({ name: 'Test', customerEmail: 'kunde@example.com', pin: 'x', sendAutoMail: true, lang });

(async () => {
  // Sprache en: ein create, Sprache und SendAutoMail gemeinsam
  let t = service(true);
  await t.srv.create(neu('en'));
  assert.strictEqual(t.calls.length, 1);
  assert.strictEqual(t.calls[0].Sprache, 'en');
  assert.strictEqual(t.calls[0].SendAutoMail, true);
  assert.strictEqual(t.calls[0].Status, 'Neu');

  // Feld fehlt → zweites create ohne Sprache, kein Fehler
  t = service(false);
  const r = await t.srv.create(neu('es'));
  assert.strictEqual(t.calls.length, 2);
  assert.ok(!('Sprache' in t.calls[1]));
  assert.strictEqual(t.calls[1].SendAutoMail, true);
  assert.ok(r);

  // Ohne Sprache (z. B. alte Aufrufe ohne lang) → Feld wird nicht gesetzt
  t = service(true);
  await t.srv.create(neu(undefined));
  assert.strictEqual(t.calls.length, 1);
  assert.ok(!('Sprache' in t.calls[0]));

  console.log('ok – Sprache beim Anlegen');
})().catch(e => { console.error(e); process.exit(1); });
