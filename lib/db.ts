import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// --- Tipos ---

export interface Scan {
  id: number;
  timestamp: string;
  status: string;
  duration_ms: number;
  pages_scanned: number;
  total_issues: number;
}

export interface PageData {
  id: number;
  scan_id: number;
  url: string;
  status_code: number;
  response_time_ms: number;
  title: string | null;
  description: string | null;
  h1_count: number;
  h2_count: number;
  total_headings: number;
  total_images: number;
  total_links_internal: number;
  total_links_external: number;
  total_scripts: number;
  total_styles: number;
  meta_viewport: string | null;
  meta_robots: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
}

export interface CssClass {
  id: number;
  scan_id: number;
  page_url: string;
  class_name: string;
  element_tag: string;
  frequency: number;
}

export interface Issue {
  id: number;
  scan_id: number;
  page_url: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface CustomCode {
  id: number;
  scan_id: number;
  page_url: string;
  type: string;
  location: string;
  content: string;
  size_bytes: number;
}

export interface Setting {
  key: string;
  value: string;
}

// --- Base de datos ---

const DB_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "monitor.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'pending',
      duration_ms INTEGER NOT NULL DEFAULT 0,
      pages_scanned INTEGER NOT NULL DEFAULT 0,
      total_issues INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      status_code INTEGER NOT NULL DEFAULT 0,
      response_time_ms INTEGER NOT NULL DEFAULT 0,
      title TEXT,
      description TEXT,
      h1_count INTEGER NOT NULL DEFAULT 0,
      h2_count INTEGER NOT NULL DEFAULT 0,
      total_headings INTEGER NOT NULL DEFAULT 0,
      total_images INTEGER NOT NULL DEFAULT 0,
      total_links_internal INTEGER NOT NULL DEFAULT 0,
      total_links_external INTEGER NOT NULL DEFAULT 0,
      total_scripts INTEGER NOT NULL DEFAULT 0,
      total_styles INTEGER NOT NULL DEFAULT 0,
      meta_viewport TEXT,
      meta_robots TEXT,
      canonical_url TEXT,
      og_title TEXT,
      og_description TEXT,
      og_image TEXT,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS css_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      page_url TEXT NOT NULL,
      class_name TEXT NOT NULL,
      element_tag TEXT NOT NULL,
      frequency INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      page_url TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS custom_code (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      page_url TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      content TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

// --- Funciones de scans ---

export function saveScan(scan: Omit<Scan, "id">): Scan {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO scans (timestamp, status, duration_ms, pages_scanned, total_issues)
    VALUES (@timestamp, @status, @duration_ms, @pages_scanned, @total_issues)
  `);
  const result = stmt.run(scan);
  return { ...scan, id: result.lastInsertRowid as number };
}

export function getLatestScan(): Scan | undefined {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT * FROM scans ORDER BY id DESC LIMIT 1"
  );
  return stmt.get() as Scan | undefined;
}

export function getScanHistory(limit: number = 20): Scan[] {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT * FROM scans ORDER BY id DESC LIMIT ?"
  );
  return stmt.all(limit) as Scan[];
}

// --- Funciones de pages ---

export function savePageData(page: Omit<PageData, "id">): PageData {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO pages (
      scan_id, url, status_code, response_time_ms, title, description,
      h1_count, h2_count, total_headings, total_images,
      total_links_internal, total_links_external,
      total_scripts, total_styles, meta_viewport, meta_robots,
      canonical_url, og_title, og_description, og_image
    ) VALUES (
      @scan_id, @url, @status_code, @response_time_ms, @title, @description,
      @h1_count, @h2_count, @total_headings, @total_images,
      @total_links_internal, @total_links_external,
      @total_scripts, @total_styles, @meta_viewport, @meta_robots,
      @canonical_url, @og_title, @og_description, @og_image
    )
  `);
  const result = stmt.run(page);
  return { ...page, id: result.lastInsertRowid as number };
}

export function getPagesByScan(scanId: number): PageData[] {
  const database = getDb();
  const stmt = database.prepare("SELECT * FROM pages WHERE scan_id = ?");
  return stmt.all(scanId) as PageData[];
}

// --- Funciones de css_classes ---

export function saveCssClass(cssClass: Omit<CssClass, "id">): CssClass {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO css_classes (scan_id, page_url, class_name, element_tag, frequency)
    VALUES (@scan_id, @page_url, @class_name, @element_tag, @frequency)
  `);
  const result = stmt.run(cssClass);
  return { ...cssClass, id: result.lastInsertRowid as number };
}

export function getCssClassesByScan(scanId: number): CssClass[] {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT * FROM css_classes WHERE scan_id = ?"
  );
  return stmt.all(scanId) as CssClass[];
}

// --- Funciones de issues ---

export function saveIssue(issue: Omit<Issue, "id">): Issue {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO issues (scan_id, page_url, category, severity, title, description, recommendation)
    VALUES (@scan_id, @page_url, @category, @severity, @title, @description, @recommendation)
  `);
  const result = stmt.run(issue);
  return { ...issue, id: result.lastInsertRowid as number };
}

export function getIssuesByScan(scanId: number): Issue[] {
  const database = getDb();
  const stmt = database.prepare("SELECT * FROM issues WHERE scan_id = ?");
  return stmt.all(scanId) as Issue[];
}

// --- Funciones de custom_code ---

export function saveCustomCode(
  customCode: Omit<CustomCode, "id">
): CustomCode {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO custom_code (scan_id, page_url, type, location, content, size_bytes)
    VALUES (@scan_id, @page_url, @type, @location, @content, @size_bytes)
  `);
  const result = stmt.run(customCode);
  return { ...customCode, id: result.lastInsertRowid as number };
}

export function getCustomCodeByScan(scanId: number): CustomCode[] {
  const database = getDb();
  const stmt = database.prepare(
    "SELECT * FROM custom_code WHERE scan_id = ?"
  );
  return stmt.all(scanId) as CustomCode[];
}

// --- Funciones de settings ---

export function getSetting(key: string): string | undefined {
  const database = getDb();
  const stmt = database.prepare("SELECT value FROM settings WHERE key = ?");
  const row = stmt.get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  stmt.run(key, value);
}

// --- Limpieza ---

export function clearHistory(): void {
  const database = getDb();
  database.exec(`
    DELETE FROM custom_code;
    DELETE FROM issues;
    DELETE FROM css_classes;
    DELETE FROM pages;
    DELETE FROM scans;
  `);
}
