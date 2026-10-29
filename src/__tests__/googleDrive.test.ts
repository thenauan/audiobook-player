import { describe, it, expect } from 'vitest';
import { parseDriveLink } from '../googleDrive';

describe('links do Google Drive', () => {
  const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';
  it('arquivo', () => {
    expect(parseDriveLink(`https://drive.google.com/file/d/${id}/view?usp=sharing`)).toEqual({ kind: 'file', id });
    expect(parseDriveLink(`https://drive.google.com/open?id=${id}`)).toEqual({ kind: 'file', id });
    expect(parseDriveLink(`https://drive.google.com/uc?export=download&id=${id}`)).toEqual({ kind: 'file', id });
  });
  it('pasta', () => {
    expect(parseDriveLink(`https://drive.google.com/drive/folders/${id}?usp=sharing`)).toEqual({ kind: 'folder', id });
    expect(parseDriveLink(`https://drive.google.com/drive/u/0/folders/${id}`)).toEqual({ kind: 'folder', id });
  });
  it('link inválido', () => {
    expect(parseDriveLink('https://example.com/qualquer')).toBeNull();
    expect(parseDriveLink('')).toBeNull();
  });
});
