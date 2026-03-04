/**
 * generate-production.ts
 *
 * Reads ItemNumbering.csv and merges every cratable item into production.json.
 * Existing entries with production recipes are preserved.
 * Run once from the project root:
 *   npx ts-node scripts/generate-production.ts
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const CSV_PATH = path.resolve('ItemNumbering.csv');
const JSON_PATH = path.resolve('production.json');

// ─── Category helpers ─────────────────────────────────────────────────────────

const MPF_CATEGORIES = new Set(['Small Arms', 'Heavy Arms', 'Heavy Ammunition', 'Medical']);
const NO_PROD_CATEGORIES = new Set(['Resource']);  // raw materials — no production

function freightForCategory(category: string): number {
    return (category === 'Shippable' || category === 'Shippables') ? 3 : 1;
}

function bMPFForCategory(category: string): boolean | null {
    if (NO_PROD_CATEGORIES.has(category)) return null;
    return MPF_CATEGORIES.has(category);
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────

interface CsvRow {
    '#': string;
    I: string;
    C: string;
    Name: string;
    Nickname: string;
    SubType: string;
    Ammo: string;
    Faction: string;
    StockpileCategory: string;
    CustomCategory: string;
    CategorySort: string;
    InCategorySort: string;
    IndExists: string;
    CrateExists: string;
    perCrate: string;
    Bmats: string;
    Emats: string;
    Rmats: string;
    Hemats: string;
    Relicmats: string;
}

async function readCsv(): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
        const rows: CsvRow[] = [];
        fs.createReadStream(CSV_PATH)
            .pipe(csv())
            .on('data', (row: CsvRow) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', reject);
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    // Load existing production.json (keyed by lowercase name for dedup)
    let existing: any[] = [];
    try {
        existing = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    } catch {
        console.log('No existing production.json found — creating from scratch.');
    }

    const existingByName = new Map<string, any>(
        existing.map((e) => [e.name.toLowerCase(), e])
    );

    const rows = await readCsv();
    let added = 0;

    for (const row of rows) {
        const name = row.Name?.trim();
        if (!name || name === 'Reserved') continue;

        // Only include items with a crate form
        if (row.CrateExists !== '1') continue;

        const key = name.toLowerCase();
        if (existingByName.has(key)) {
            // Preserve existing entry (it may have production recipes)
            continue;
        }

        const crateSize = parseInt(row.perCrate, 10) || null;
        const category = row.StockpileCategory?.trim() || '';
        const subCategory = row.CustomCategory?.trim() || '';
        const freight = freightForCategory(category);
        const bMPF = bMPFForCategory(category);

        const entry: any = {
            name,
            category,
            subCategory,
            bCrated: true,
            crateSize,
            freight,
            production: {},
        };

        if (bMPF !== null) {
            entry.bMPF = bMPF;
        }

        existingByName.set(key, entry);
        added++;
    }

    // Sort: preserve existing order, then new entries alphabetically
    const preserved = existing.map((e) => existingByName.get(e.name.toLowerCase())!);
    const newEntries = Array.from(existingByName.values())
        .filter((e) => !existing.some((ex) => ex.name.toLowerCase() === e.name.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

    const output = [...preserved, ...newEntries];
    fs.writeFileSync(JSON_PATH, JSON.stringify(output, null, 4), 'utf-8');

    console.log(`Done. Added ${added} new items. Total: ${output.length} items in production.json.`);
}

main().catch(console.error);
