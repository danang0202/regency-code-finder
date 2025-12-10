import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { parseHierarchicalCode, searchByHierarchicalCode } from '@/helper/hierarchical-code-search.helper';

/**
 * API endpoint for hierarchical region code search
 * Supports searching by province code, province+kabupaten, province+kabupaten+kecamatan, and full hierarchy
 * 
 * Query parameters:
 * - code: Region code in formats like "32", "32.07", "3207", "32.07.010", "3207010", etc.
 * 
 * Example requests:
 * - /v2/api/search-by-code?code=32 (search by province code)
 * - /v2/api/search-by-code?code=32.07 (search by province + kabupaten)
 * - /v2/api/search-by-code?code=3207010 (search by province + kabupaten + kecamatan)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || '';
  
  if (!code.trim()) {
    return NextResponse.json({ 
      provinsi: [], 
      kabupaten: [], 
      kecamatan: [], 
      desa: [] 
    }, { status: 200 });
  }
  
  // Load master data
  const jsonPath = path.join(process.cwd(), 'src/master/master_wilayah.json');
  
  let master = null;
  try {
    master = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch {
    return NextResponse.json({ 
      provinsi: [], 
      kabupaten: [], 
      kecamatan: [], 
      desa: [] 
    }, { status: 200 });
  }
  
  // Parse the hierarchical code
  const parsedCode = parseHierarchicalCode(code);
  
  // Search based on parsed code
  const result = searchByHierarchicalCode(master, parsedCode);
  
  return NextResponse.json(result, { status: 200 });
}
