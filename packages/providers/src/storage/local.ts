import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { describeError } from '@revenue-os/shared';
import { normalizeProviderError, ProviderCallError } from '../core/errors.js';
import type { CallOptions, CapabilityCheck, StorageProvider, StoredObject } from '../core/interfaces.js';

/** Sidecar that keeps an object's metadata next to its bytes — so keys ending in it are reserved. */
const META_SUFFIX = '.meta.json';
const MAX_KEY_LENGTH = 1024;
const BACKSLASH = String.fromCharCode(92);

/**
 * Private objects on the server disk (catalog key `local_storage`, docs/12 §65-66) — the development stand-in for
 * S3-compatible storage. Bytes live at `<root>/<key>`, metadata (content type, size, sha256) beside them at
 * `<root>/<key>.meta.json`. The database keeps the key + metadata, never the blob; nothing here is ever public.
 *
 * Keys are relative POSIX-style paths (`kb/docs/pricing.txt`). Anything that could leave the root — `..` segments,
 * absolute paths, drive letters, backslashes, empty segments — is refused as INVALID_REQUEST before touching the disk.
 * The adapter factory gives every workspace its own root directory, so a key can never reach another workspace.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly key = 'local_storage';
  private readonly root: string;

  constructor(rootDir: string) {
    this.root = resolve(rootDir);
  }

  /** No side effect: only makes sure the root exists and is writable (docs/12 §118). */
  async healthCheck(_options?: CallOptions): Promise<CapabilityCheck[]> {
    try {
      await mkdir(this.root, { recursive: true });
      await access(this.root, constants.R_OK | constants.W_OK);
      return [{ capability: 'STORAGE', ok: true, detail: 'Local storage directory is writable' }];
    } catch (err) {
      return [{ capability: 'STORAGE', ok: false, detail: `Local storage directory not writable: ${describeError(err)}` }];
    }
  }

  async put(key: string, body: Buffer, contentType: string, options: CallOptions): Promise<StoredObject> {
    const path = this.pathFor(key);
    options.signal?.throwIfAborted();
    const object: StoredObject = { key, size: body.byteLength, contentType, sha256: sha256(body) };
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, body);
      await writeFile(path + META_SUFFIX, JSON.stringify(object), 'utf8');
    } catch (err) {
      throw fsError(err, true);
    }
    return object;
  }

  async get(key: string, options: CallOptions): Promise<{ body: Buffer; object: StoredObject } | null> {
    const path = this.pathFor(key);
    options.signal?.throwIfAborted();
    let body: Buffer;
    try {
      body = await readFile(path);
    } catch (err) {
      if (isNotFound(err)) return null;
      throw fsError(err, false);
    }
    let object: StoredObject | null = null;
    try {
      const meta = JSON.parse(await readFile(path + META_SUFFIX, 'utf8')) as Partial<StoredObject>;
      if (typeof meta.contentType === 'string' && typeof meta.sha256 === 'string') {
        object = { key, size: body.byteLength, contentType: meta.contentType, sha256: meta.sha256 };
      }
    } catch {
      // Sidecar missing or unreadable → rebuild what we can from the bytes themselves.
    }
    return { body, object: object ?? { key, size: body.byteLength, contentType: 'application/octet-stream', sha256: sha256(body) } };
  }

  /** Idempotent: deleting a missing object is not an error. */
  async delete(key: string, options: CallOptions): Promise<void> {
    const path = this.pathFor(key);
    options.signal?.throwIfAborted();
    try {
      await rm(path, { force: true });
      await rm(path + META_SUFFIX, { force: true });
    } catch (err) {
      throw fsError(err, true);
    }
  }

  /** Validates a key and maps it to an absolute path that is guaranteed to stay inside the root. */
  private pathFor(key: string): string {
    const reason = invalidKeyReason(key);
    if (reason) throw new ProviderCallError('INVALID_REQUEST', `Invalid storage key: ${reason}`, { raw: key.slice(0, 200) });
    const full = resolve(this.root, ...key.split('/'));
    if (full !== this.root && !full.startsWith(this.root + sep)) {
      throw new ProviderCallError('INVALID_REQUEST', 'Invalid storage key: resolves outside the storage root', { raw: key.slice(0, 200) });
    }
    return full;
  }
}

function invalidKeyReason(key: string): string | null {
  if (typeof key !== 'string' || key.length === 0) return 'must not be empty';
  if (key.length > MAX_KEY_LENGTH) return `must be at most ${MAX_KEY_LENGTH} characters`;
  if (key.includes('\0')) return 'must not contain NUL characters';
  if (key.includes(BACKSLASH)) return 'must use "/" as the separator';
  if (key.startsWith('/')) return 'must be relative (no leading "/")';
  if (/^[A-Za-z]:/.test(key)) return 'must not start with a drive letter';
  if (key.endsWith(META_SUFFIX)) return `must not end with "${META_SUFFIX}" (reserved)`;
  for (const segment of key.split('/')) {
    if (segment.length === 0) return 'must not contain empty path segments';
    if (segment === '.' || segment === '..') return 'must not contain "." or ".." segments';
  }
  return null;
}

function sha256(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex');
}

function isNotFound(err: unknown): boolean {
  return (err as { code?: unknown } | null)?.code === 'ENOENT';
}

/** Local disk failures mapped onto the provider error taxonomy (docs/12 §108). */
function fsError(err: unknown, sideEffect: boolean): ProviderCallError {
  const code = (err as { code?: unknown } | null)?.code;
  if (code === 'EACCES' || code === 'EPERM' || code === 'EROFS') {
    return new ProviderCallError('PERMISSION_DENIED', `Local storage: ${describeError(err)}`, { cause: err });
  }
  if (code === 'ENOSPC') return new ProviderCallError('QUOTA_EXCEEDED', 'Local storage: disk full', { cause: err });
  return normalizeProviderError(err, sideEffect);
}
