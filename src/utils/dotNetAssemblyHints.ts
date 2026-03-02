export interface DotNetAssemblyHints {
  candidateAssemblyReferences: string[];
  dependencyHints: string[];
  externalUrls: string[];
  externalDomains: string[];
  interestingStrings: string[];
  totalStringsScanned: number;
}

const MAX_INTERESTING_STRINGS = 30;
const MIN_STRING_LENGTH = 6;

const DEPENDENCY_HINTS: Array<{ key: string; title: string; indicators: RegExp[] }> = [
  {
    key: 'dataverse',
    title: 'Dataverse or Dynamics SDK usage',
    indicators: [/microsoft\.xrm/i, /\bxrm\./i, /\borganizationservice\b/i, /\bcrmsvcutil\b/i],
  },
  {
    key: 'http',
    title: 'External HTTP integrations',
    indicators: [/\bhttpclient\b/i, /\brestsharp\b/i, /\bwebrequest\b/i, /https?:\/\//i],
  },
  {
    key: 'azure',
    title: 'Azure dependency usage',
    indicators: [/\bazure\./i, /\bservicebus\b/i, /\beventhub\b/i, /\bkeyvault\b/i],
  },
  {
    key: 'sql',
    title: 'Direct SQL or database client references',
    indicators: [/\bsqlclient\b/i, /\bnpgsql\b/i, /\bmysql\b/i, /\bdapper\b/i],
  },
  {
    key: 'json',
    title: 'JSON serialisation libraries',
    indicators: [/\bnewtonsoft\.json\b/i, /\bsystem\.text\.json\b/i],
  },
  {
    key: 'logging',
    title: 'Logging framework dependencies',
    indicators: [/\bserilog\b/i, /\bnlog\b/i, /\blog4net\b/i],
  },
];

const CANDIDATE_ASSEMBLY_REGEX =
  /^(System(?:\.[A-Za-z0-9_]+)*|Microsoft(?:\.[A-Za-z0-9_]+)*|Newtonsoft\.Json|Azure(?:\.[A-Za-z0-9_]+)*|RestSharp|Polly|Dapper|Npgsql|MySql(?:\.[A-Za-z0-9_]+)*)$/;

/**
 * Analyse recovered .NET assembly content for reverse-engineering hints.
 * This is heuristic and intentionally lightweight for browser execution.
 */
export function extractDotNetAssemblyHintsFromBase64(contentBase64: string): DotNetAssemblyHints {
  const bytes = decodeBase64(contentBase64);
  const asciiStrings = extractAsciiStrings(bytes, MIN_STRING_LENGTH);
  const utf16Strings = extractUtf16LeStrings(bytes, MIN_STRING_LENGTH);
  const metadataStrings = extractCliMetadataStrings(bytes);

  const allStrings = dedupeStrings([...metadataStrings, ...asciiStrings, ...utf16Strings]);
  const joined = allStrings.join('\n');

  const externalUrls = dedupeStrings(
    allStrings.flatMap(str => (str.match(/https?:\/\/[^\s"'<>]+/gi) || []))
  );
  const externalDomains = dedupeStrings(
    externalUrls
      .map(url => {
        try {
          return new URL(url).hostname.toLowerCase();
        } catch {
          return '';
        }
      })
      .filter(Boolean)
  );

  const candidateAssemblyReferences = dedupeStrings(
    metadataStrings
      .filter(value => value.length <= 80 && !value.includes(' '))
      .filter(value => CANDIDATE_ASSEMBLY_REGEX.test(value))
  ).sort((a, b) => a.localeCompare(b));

  const dependencyHints = DEPENDENCY_HINTS
    .filter(hint => hint.indicators.some(pattern => pattern.test(joined)))
    .map(hint => hint.title);

  const interestingStrings = dedupeStrings(
    allStrings.filter(value => isInterestingString(value))
  ).slice(0, MAX_INTERESTING_STRINGS);

  return {
    candidateAssemblyReferences,
    dependencyHints,
    externalUrls,
    externalDomains,
    interestingStrings,
    totalStringsScanned: allStrings.length,
  };
}

function decodeBase64(contentBase64: string): Uint8Array {
  const sanitized = contentBase64.replace(/\s/g, '');
  const binary = atob(sanitized);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function extractAsciiStrings(bytes: Uint8Array, minLength: number): string[] {
  const results: string[] = [];
  let current = '';

  for (let i = 0; i < bytes.length; i += 1) {
    const value = bytes[i];
    if (value >= 32 && value <= 126) {
      current += String.fromCharCode(value);
      continue;
    }

    if (current.length >= minLength) {
      results.push(current);
    }
    current = '';
  }

  if (current.length >= minLength) {
    results.push(current);
  }

  return results;
}

function extractUtf16LeStrings(bytes: Uint8Array, minLength: number): string[] {
  const results: string[] = [];
  const chars: number[] = [];

  for (let i = 0; i < bytes.length - 1; i += 2) {
    const charCode = bytes[i] | (bytes[i + 1] << 8);
    if (charCode >= 32 && charCode <= 126) {
      chars.push(charCode);
      continue;
    }

    if (chars.length >= minLength) {
      results.push(String.fromCharCode(...chars));
    }
    chars.length = 0;
  }

  if (chars.length >= minLength) {
    results.push(String.fromCharCode(...chars));
  }

  return results;
}

function extractCliMetadataStrings(bytes: Uint8Array): string[] {
  try {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const peHeaderOffset = readUInt32(view, 0x3c);
    if (readUInt32(view, peHeaderOffset) !== 0x00004550) {
      return [];
    }

    const numberOfSections = readUInt16(view, peHeaderOffset + 6);
    const optionalHeaderSize = readUInt16(view, peHeaderOffset + 20);
    const optionalHeaderOffset = peHeaderOffset + 24;
    const magic = readUInt16(view, optionalHeaderOffset);
    const dataDirectoryOffset = optionalHeaderOffset + (magic === 0x20b ? 112 : 96);

    const cliHeaderRva = readUInt32(view, dataDirectoryOffset + 14 * 8);
    if (!cliHeaderRva) {
      return [];
    }

    const sectionTableOffset = optionalHeaderOffset + optionalHeaderSize;
    const sections = readSections(view, sectionTableOffset, numberOfSections);
    const cliHeaderOffset = rvaToOffset(cliHeaderRva, sections);
    if (cliHeaderOffset === undefined) {
      return [];
    }

    const metadataRva = readUInt32(view, cliHeaderOffset + 8);
    const metadataOffset = rvaToOffset(metadataRva, sections);
    if (metadataOffset === undefined) {
      return [];
    }

    const signature = readUInt32(view, metadataOffset);
    if (signature !== 0x424a5342) {
      return [];
    }

    const versionLength = readUInt32(view, metadataOffset + 12);
    const streamCount = readUInt16(view, metadataOffset + 18 + versionLength);
    let streamHeaderOffset = metadataOffset + 20 + versionLength;

    const streams = new Map<string, { offset: number; size: number }>();
    for (let i = 0; i < streamCount; i += 1) {
      const offset = readUInt32(view, streamHeaderOffset);
      const size = readUInt32(view, streamHeaderOffset + 4);
      const nameStart = streamHeaderOffset + 8;
      const name = readNullTerminatedAscii(view, nameStart);
      streams.set(name, { offset: metadataOffset + offset, size });
      streamHeaderOffset = align4(nameStart + name.length + 1);
    }

    const stringsStream = streams.get('#Strings');
    if (!stringsStream) {
      return [];
    }

    return readStringsHeap(view, stringsStream.offset, stringsStream.size);
  } catch {
    return [];
  }
}

function readStringsHeap(view: DataView, offset: number, size: number): string[] {
  const results: string[] = [];
  let cursor = offset + 1;
  const end = offset + size;

  while (cursor < end) {
    const value = readNullTerminatedAscii(view, cursor);
    if (value.length > 0) {
      results.push(value);
    }
    cursor += value.length + 1;
  }

  return results;
}

function readSections(
  view: DataView,
  sectionTableOffset: number,
  numberOfSections: number
): Array<{ virtualAddress: number; virtualSize: number; rawAddress: number; rawSize: number }> {
  const sections: Array<{ virtualAddress: number; virtualSize: number; rawAddress: number; rawSize: number }> = [];

  for (let i = 0; i < numberOfSections; i += 1) {
    const entryOffset = sectionTableOffset + i * 40;
    sections.push({
      virtualSize: readUInt32(view, entryOffset + 8),
      virtualAddress: readUInt32(view, entryOffset + 12),
      rawSize: readUInt32(view, entryOffset + 16),
      rawAddress: readUInt32(view, entryOffset + 20),
    });
  }

  return sections;
}

function rvaToOffset(
  rva: number,
  sections: Array<{ virtualAddress: number; virtualSize: number; rawAddress: number; rawSize: number }>
): number | undefined {
  for (const section of sections) {
    const sectionStart = section.virtualAddress;
    const sectionEnd = sectionStart + Math.max(section.virtualSize, section.rawSize);
    if (rva >= sectionStart && rva < sectionEnd) {
      return section.rawAddress + (rva - sectionStart);
    }
  }
  return undefined;
}

function readNullTerminatedAscii(view: DataView, startOffset: number): string {
  const chars: number[] = [];
  let offset = startOffset;

  while (offset < view.byteLength) {
    const value = view.getUint8(offset);
    if (value === 0) {
      break;
    }
    chars.push(value);
    offset += 1;
  }

  return String.fromCharCode(...chars);
}

function readUInt16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUInt32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function align4(value: number): number {
  return (value + 3) & ~3;
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)));
}

function isInterestingString(value: string): boolean {
  if (value.length < MIN_STRING_LENGTH || value.length > 180) {
    return false;
  }

  if (/^([A-Za-z0-9_]+\.)+[A-Za-z0-9_]+$/.test(value)) {
    return true;
  }

  if (/https?:\/\//i.test(value)) {
    return true;
  }

  return /IOrganizationService|HttpClient|ExecuteMultiple|servicebus|keyvault|oauth|token|connectionstring/i.test(value);
}
