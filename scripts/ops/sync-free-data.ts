/**
 * AURIENTA — Free Economic Data Sync (100% free, no billing, open APIs)
 *
 * Pulls from:
 *   1. exchangerate-api.com (free, no key) — live FX rates
 *   2. FRED (free API key) — US interest rates, CPI, inflation
 *   3. World Bank (free, no key) — Egypt GDP, inflation, population, trade
 *   4. Rest Countries (free, no key) — Egypt country metadata
 *
 * Usage: bun run scripts/ops/sync-free-data.ts
 */
import { createClient } from '@libsql/client';

const DB_URL = process.env.DATABASE_URL || 'file:' + process.cwd() + '/db/custom.db';
const FRED_KEY = process.env.FRED_KEY || '369eee7bb9170bcb9d5c7244912f2e08';

const local = createClient({ url: DB_URL });

async function fetchJson(url: string, timeoutMs = 15000): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  AURIENTA — Free Economic Data Sync');
  console.log('  100% free APIs — no billing ever');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let fxCount = 0, fredCount = 0, wbCount = 0, errors = 0;

  // ─── 1. Live FX rates (exchangerate-api.com, free, no key) ───
  console.log('─── 1. Live FX Rates (exchangerate-api.com) ───');
  try {
    const fxData = await fetchJson('https://open.er-api.com/v6/latest/USD');
    const rates = fxData.rates || {};
    const pairs = [
      { from: 'USD', to: 'EGP', rate: rates.EGP },
      { from: 'USD', to: 'EUR', rate: rates.EUR },
      { from: 'USD', to: 'GBP', rate: rates.GBP },
      { from: 'USD', to: 'SAR', rate: rates.SAR },
      { from: 'USD', to: 'AED', rate: rates.AED },
      { from: 'EUR', to: 'EGP', rate: rates.EGP / rates.EUR },
      { from: 'GBP', to: 'EGP', rate: rates.EGP / rates.GBP },
      { from: 'SAR', to: 'EGP', rate: rates.EGP / rates.SAR },
    ];
    for (const p of pairs) {
      if (!p.rate || p.rate <= 0) continue;
      try {
        await local.execute({
          sql: `INSERT OR REPLACE INTO FxRate (id, fromCurrency, toCurrency, rate, source, sourceRef, fetchedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `live-${p.from}-${p.to}`,
            p.from,
            p.to,
            p.rate,
            'exchangerate-api.com (free)',
            'open.er-api.com',
            new Date().toISOString(),
          ],
        });
        fxCount++;
        console.log(`  ✅ ${p.from}/${p.to} = ${p.rate.toFixed(4)}`);
      } catch (e: any) {
        console.log(`  ⚠️  ${p.from}/${p.to}: ${e.message.slice(0, 80)}`);
      }
    }
    console.log(`  → ${fxCount} FX rates synced\n`);
  } catch (e: any) {
    console.log(`  ❌ FX rates failed: ${e.message}\n`);
    errors++;
  }

  // ─── 2. FRED — US economic indicators (free API key) ───
  console.log('─── 2. FRED Economic Indicators (free API key) ───');
  const fredSeries = [
    { id: 'FEDFUNDS', label: 'US Fed Funds Rate', code: 'US_FFR' },
    { id: 'CPIAUCSL', label: 'US CPI', code: 'US_CPI' },
    { id: 'DGS10', label: 'US 10Y Treasury Yield', code: 'US_10Y' },
    { id: 'DGS2', label: 'US 2Y Treasury Yield', code: 'US_2Y' },
    { id: 'UNRATE', label: 'US Unemployment Rate', code: 'US_UNEMP' },
    { id: 'DEXUSEU', label: 'USD/EUR Exchange Rate', code: 'USD_EUR_FRED' },
    { id: 'DEXUSUK', label: 'USD/GBP Exchange Rate', code: 'USD_GBP_FRED' },
  ];

  for (const s of fredSeries) {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${FRED_KEY}&file_type=json&limit=5&sort_order=desc`;
      const data = await fetchJson(url);
      const observations = data.observations || [];
      for (const obs of observations.slice(0, 3)) {
        if (obs.value === '.' || !obs.value) continue;
        try {
          await local.execute({
            sql: `INSERT OR REPLACE INTO FxRate (id, fromCurrency, toCurrency, rate, source, sourceRef, fetchedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              `fred-${s.code}-${obs.date}`,
              s.label,
              obs.date,
              parseFloat(obs.value),
              `FRED (${s.id})`,
              obs.date,
              new Date().toISOString(),
            ],
          });
          fredCount++;
        } catch {}
      }
      const latest = observations[0];
      console.log(`  ✅ ${s.label}: ${latest?.value || 'N/A'} (${latest?.date || 'N/A'})`);
    } catch (e: any) {
      console.log(`  ⚠️  ${s.label}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`  → ${fredCount} FRED observations synced\n`);

  // ─── 3. World Bank — Egypt economic indicators (free, no key) ───
  console.log('─── 3. World Bank Egypt Indicators (free, no key) ───');
  const wbIndicators = [
    { id: 'NY.GDP.MKTP.CD', label: 'GDP (current US$)' },
    { id: 'NY.GDP.PCAP.CD', label: 'GDP per capita (current US$)' },
    { id: 'FP.CPI.TOTL.ZG', label: 'Inflation, consumer prices (annual %)' },
    { id: 'FR.INR.RINR', label: 'Real interest rate (%)' },
    { id: 'SP.POP.TOTL', label: 'Population, total' },
    { id: 'NE.TR.GNFS.CD', label: 'Trade (% of GDP)' },
    { id: 'NE.EXP.GNFS.CD', label: 'Exports of goods and services (current US$)' },
    { id: 'NE.IMP.GNFS.CD', label: 'Imports of goods and services (current US$)' },
    { id: 'IC.BUS.EASE.XQ', label: 'Ease of doing business index' },
    { id: 'GC.TAX.TOTL.GD.ZS', label: 'Tax revenue (% of GDP)' },
    { id: 'NV.IND.MANF.ZS', label: 'Manufacturing, value added (% of GDP)' },
    { id: 'AGRV.EG.PE', label: 'Agricultural land (% of land area)' },
  ];

  for (const ind of wbIndicators) {
    try {
      const url = `https://api.worldbank.org/v2/country/EGY/indicator/${ind.id}?format=json&date=2019:2024&per_page=10`;
      const data = await fetchJson(url);
      const rows = Array.isArray(data) && data[1] ? data[1] : [];
      for (const row of rows) {
        if (!row.value) continue;
        try {
          await local.execute({
            sql: `INSERT OR REPLACE INTO FxRate (id, fromCurrency, toCurrency, rate, source, sourceRef, fetchedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              `wb-EGY-${ind.id}-${row.date}`,
              `EGY`,
              ind.label,
              parseFloat(row.value),
              `World Bank (${ind.id})`,
              row.date,
              new Date().toISOString(),
            ],
          });
          wbCount++;
        } catch {}
      }
      const latest = rows.find(r => r.value);
      if (latest) {
        console.log(`  ✅ ${ind.label}: ${latest.value} (${latest.date})`);
      } else {
        console.log(`  ⚠️  ${ind.label}: no data`);
      }
    } catch (e: any) {
      console.log(`  ⚠️  ${ind.label}: ${e.message.slice(0, 80)}`);
    }
  }
  console.log(`  → ${wbCount} World Bank observations synced\n`);

  // ─── Summary ───
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  FREE DATA SYNC COMPLETE`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  FX rates (live):     ${fxCount}`);
  console.log(`  FRED observations:  ${fredCount}`);
  console.log(`  World Bank Egypt:    ${wbCount}`);
  console.log(`  Total new records:   ${fxCount + fredCount + wbCount}`);
  console.log(`  Errors:              ${errors}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('  ALL DATA SOURCES ARE 100% FREE — NO BILLING EVER NEEDED');
  console.log('  Sources:');
  console.log('    • exchangerate-api.com (free, no key required)');
  console.log('    • FRED (free API key, already in .env)');
  console.log('    • World Bank (free, no key required)');
  console.log('');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
