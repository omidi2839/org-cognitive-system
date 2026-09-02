import crypto from 'node:crypto';
export const newId = (prefix) => `${prefix}:${crypto.randomUUID()}`;
export const now = () => new Date().toISOString();
export const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const assert = (condition, code, message) => { if (!condition) { const e=new Error(message); e.code=code; throw e; } };
export const zones = ['private','role','organizational'];
export const classifications = ['internal','restricted','confidential','highly_confidential'];
