// 분석 이력 저장소 — data/history.json 파일 기반 (DB 없이 간단하게).
// 같은 계정을 재분석하면 새 기록으로 누적되어 ER 변화 추이를 확인할 수 있습니다.

const fs = require('fs');
const path = require('path');

// 배포 환경에서 영구 디스크를 쓸 경우 DATA_DIR로 저장 위치를 바꿀 수 있음
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'history.json');

function load() {
  try {
    const records = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    return Array.isArray(records) ? records : [];
  } catch {
    return []; // 파일 없음/손상 시 빈 이력으로 시작
  }
}

function save(records) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(records, null, 2), 'utf8');
}

function makeId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// 최신순 전체 목록
function getAll() {
  return load().sort(
    (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
  );
}

function getByUsername(username) {
  return getAll().filter(
    (r) => r.username.toLowerCase() === String(username).toLowerCase()
  );
}

function getById(id) {
  return load().find((r) => r.id === id) || null;
}

function addRecord(data) {
  const records = load();
  const record = { id: makeId(), analyzedAt: new Date().toISOString(), ...data };
  records.push(record);
  save(records);
  return record;
}

function updateRecord(id, updater) {
  const records = load();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  records[idx] = updater(records[idx]);
  save(records);
  return records[idx];
}

function deleteRecord(id) {
  const records = load();
  const next = records.filter((r) => r.id !== id);
  if (next.length === records.length) return false;
  save(next);
  return true;
}

module.exports = { getAll, getByUsername, getById, addRecord, updateRecord, deleteRecord };
