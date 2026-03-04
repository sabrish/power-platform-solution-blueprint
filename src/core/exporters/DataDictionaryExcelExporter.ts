import JSZip from 'jszip';
import type {
  AttributeMetadata,
  BlueprintResult,
  DetailedEntityMetadata,
  EntityBlueprint,
  EntityKey,
  ManyToManyRelationship,
  ManyToOneRelationship,
  OneToManyRelationship,
} from '../types/blueprint.js';

type CellValue = string | number | boolean | null;

interface Cell {
  value: CellValue;
  styleId?: number;
}

interface SheetDefinition {
  name: string;
  columns: number[];
  rows: Cell[][];
}

interface RelationshipRow {
  name: string;
  type: string;
  parentTable: string;
  childTable: string;
  parentColumn: string;
  childColumn: string;
  custom: string;
  managed: string;
}

class SharedStringTable {
  private readonly map = new Map<string, number>();
  private readonly values: string[] = [];
  private totalCount = 0;

  getIndex(value: string): number {
    const safeValue = sanitizeCellText(value);
    this.totalCount++;

    const existing = this.map.get(safeValue);
    if (existing !== undefined) {
      return existing;
    }

    const index = this.values.length;
    this.values.push(safeValue);
    this.map.set(safeValue, index);
    return index;
  }

  toXml(): string {
    const content = this.values
      .map((value) => `<si><t xml:space=\"preserve\">${escapeXml(value)}</t></si>`)
      .join('');

    return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<sst xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" count=\"${this.totalCount}\" uniqueCount=\"${this.values.length}\">${content}</sst>`;
  }
}

/**
 * Exports Dataverse metadata into an Excel data dictionary workbook.
 */
export class DataDictionaryExcelExporter {
  async export(result: BlueprintResult): Promise<Blob> {
    const sharedStrings = new SharedStringTable();
    const sheets = this.buildSheets(result);
    const zip = new JSZip();
    const generatedAt = new Date();

    zip.file('[Content_Types].xml', buildContentTypesXml(sheets.length));
    zip.folder('_rels')?.file('.rels', buildRootRelsXml());

    const xlFolder = zip.folder('xl');
    xlFolder?.file('workbook.xml', buildWorkbookXml(sheets));
    xlFolder?.folder('_rels')?.file('workbook.xml.rels', buildWorkbookRelsXml(sheets.length));
    xlFolder?.file('styles.xml', STYLES_XML);

    const worksheetsFolder = xlFolder?.folder('worksheets');
    sheets.forEach((sheet, index) => {
      worksheetsFolder?.file(`sheet${index + 1}.xml`, buildWorksheetXml(sheet, sharedStrings));
    });

    xlFolder?.file('sharedStrings.xml', sharedStrings.toXml());
    const docPropsFolder = zip.folder('docProps');
    docPropsFolder?.file('app.xml', buildAppPropsXml(sheets));
    docPropsFolder?.file('core.xml', buildCorePropsXml(generatedAt));

    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
  }

  private buildSheets(result: BlueprintResult): SheetDefinition[] {
    return [
      this.buildSummarySheet(result),
      this.buildTablesSheet(result),
      this.buildColumnsSheet(result),
      this.buildRelationshipsSheet(result),
      this.buildOptionSetSheet(result),
      this.buildKeysSheet(result),
    ];
  }

  private buildSummarySheet(result: BlueprintResult): SheetDefinition {
    const header = toHeaderRow(['Metric', 'Value']);
    const rows: Cell[][] = [header];

    const metrics: Array<[string, CellValue]> = [
      ['Generated At (UTC)', result.metadata.generatedAt instanceof Date ? result.metadata.generatedAt.toISOString() : new Date(result.metadata.generatedAt).toISOString()],
      ['Environment', result.metadata.environment],
      ['Scope Type', result.metadata.scope.type],
      ['Scope Description', result.metadata.scope.description],
      ['Entity Count', result.entities.length],
      ['Attribute Count', result.summary.totalAttributes],
      ['Relationship Count', this.countRelationships(result.entities)],
      ['Option Set Values Count', this.countOptionSetValues(result.entities)],
      ['Alternate Key Count', this.countAlternateKeys(result.entities)],
    ];

    for (const [metric, value] of metrics) {
      rows.push([{ value: metric }, { value }]);
    }

    return {
      name: 'Summary',
      columns: [36, 120],
      rows,
    };
  }

  private buildTablesSheet(result: BlueprintResult): SheetDefinition {
    const rows: Cell[][] = [
      toHeaderRow([
        'Table Logical Name',
        'Display Name',
        'Schema Name',
        'Description',
        'Primary Key',
        'Primary Name',
        'Ownership Type',
        'Is Custom',
        'Is Managed',
        'Audit Enabled',
        'Change Tracking Enabled',
        'Attribute Count',
      ]),
    ];

    const sortedEntities = [...result.entities].sort((a, b) => a.entity.LogicalName.localeCompare(b.entity.LogicalName));

    for (const blueprint of sortedEntities) {
      const entity = blueprint.entity;
      rows.push([
        { value: entity.LogicalName },
        { value: getLabel(entity.DisplayName) },
        { value: entity.SchemaName },
        { value: getLabel(entity.Description) },
        { value: entity.PrimaryIdAttribute },
        { value: entity.PrimaryNameAttribute },
        { value: entity.OwnershipTypeName || '' },
        { value: toYesNo(entity.IsCustomEntity) },
        { value: toYesNo(entity.IsManaged) },
        { value: toYesNo(entity.IsAuditEnabled?.Value) },
        { value: toYesNo(entity.ChangeTrackingEnabled) },
        { value: entity.Attributes?.length || 0 },
      ]);
    }

    return {
      name: 'Tables',
      columns: [28, 28, 28, 48, 24, 24, 18, 12, 12, 14, 20, 16],
      rows,
    };
  }

  private buildColumnsSheet(result: BlueprintResult): SheetDefinition {
    const rows: Cell[][] = [
      toHeaderRow([
        'Table Logical Name',
        'Column Logical Name',
        'Display Name',
        'Schema Name',
        'Type',
        'Required Level',
        'Primary Key',
        'Primary Name',
        'Readable',
        'Creatable',
        'Updatable',
        'Advanced Find',
        'Secured',
        'Audit Enabled',
        'Format',
        'Max Length',
        'Precision',
        'Minimum Value',
        'Maximum Value',
        'Targets',
        'Option Count',
        'Description',
        'Is Custom',
        'Is Managed',
      ]),
    ];

    const sortedEntities = [...result.entities].sort((a, b) => a.entity.LogicalName.localeCompare(b.entity.LogicalName));

    for (const blueprint of sortedEntities) {
      const attributes = [...(blueprint.entity.Attributes || [])].sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));

      for (const attribute of attributes) {
        const isPrimaryKey = attribute.LogicalName === blueprint.entity.PrimaryIdAttribute || attribute.IsPrimaryId;
        const styleId = isPrimaryKey ? 2 : undefined;
        rows.push([
          { value: blueprint.entity.LogicalName },
          { value: attribute.LogicalName, styleId },
          { value: getLabel(attribute.DisplayName) },
          { value: attribute.SchemaName || '' },
          { value: attribute.AttributeType || '' },
          { value: attribute.RequiredLevel?.Value || '' },
          { value: toYesNo(isPrimaryKey), styleId },
          { value: toYesNo(attribute.IsPrimaryName) },
          { value: toYesNo(attribute.IsValidForRead) },
          { value: toYesNo(attribute.IsValidForCreate) },
          { value: toYesNo(attribute.IsValidForUpdate) },
          { value: toYesNo(attribute.IsValidForAdvancedFind?.Value) },
          { value: toYesNo(attribute.IsSecured) },
          { value: toYesNo(attribute.IsAuditEnabled?.Value) },
          { value: attribute.Format || attribute.DateTimeBehavior?.Value || '' },
          { value: toScalar(attribute.MaxLength) },
          { value: toScalar(attribute.Precision) },
          { value: toScalar(attribute.MinValue) },
          { value: toScalar(attribute.MaxValue) },
          { value: (attribute.Targets || []).join(', ') },
          { value: attribute.OptionSet?.Options?.length || 0 },
          { value: getLabel(attribute.Description) },
          { value: toYesNo(attribute.IsCustomAttribute) },
          { value: toYesNo(attribute.IsManaged) },
        ]);
      }
    }

    return {
      name: 'Columns',
      columns: [24, 26, 24, 24, 14, 14, 12, 12, 12, 12, 12, 14, 10, 14, 16, 12, 12, 12, 12, 20, 12, 36, 10, 10],
      rows,
    };
  }

  private buildRelationshipsSheet(result: BlueprintResult): SheetDefinition {
    const rows: Cell[][] = [
      toHeaderRow([
        'Relationship Name',
        'Type',
        'Parent Table',
        'Child Table',
        'Parent Column',
        'Child Column',
        'Is Custom',
        'Is Managed',
      ]),
    ];

    const dedupe = new Map<string, RelationshipRow>();

    for (const blueprint of result.entities) {
      const entity = blueprint.entity;

      for (const rel of entity.ManyToOneRelationships || []) {
        const row = this.mapManyToOne(rel);
        dedupe.set(keyRelationship(row), row);
      }

      for (const rel of entity.OneToManyRelationships || []) {
        const row = this.mapOneToMany(rel);
        dedupe.set(keyRelationship(row), row);
      }

      for (const rel of entity.ManyToManyRelationships || []) {
        const row = this.mapManyToMany(rel);
        dedupe.set(keyRelationship(row), row);
      }
    }

    const sortedRows = [...dedupe.values()].sort((a, b) => a.name.localeCompare(b.name));
    for (const row of sortedRows) {
      rows.push([
        { value: row.name },
        { value: row.type },
        { value: row.parentTable },
        { value: row.childTable },
        { value: row.parentColumn },
        { value: row.childColumn },
        { value: row.custom },
        { value: row.managed },
      ]);
    }

    return {
      name: 'Relationships',
      columns: [32, 18, 24, 24, 24, 24, 12, 12],
      rows,
    };
  }

  private buildOptionSetSheet(result: BlueprintResult): SheetDefinition {
    const rows: Cell[][] = [
      toHeaderRow([
        'Table Logical Name',
        'Column Logical Name',
        'Column Display Name',
        'Option Value',
        'Option Label',
        'Colour',
      ]),
    ];

    const sortedEntities = [...result.entities].sort((a, b) => a.entity.LogicalName.localeCompare(b.entity.LogicalName));

    for (const blueprint of sortedEntities) {
      const attributes = [...(blueprint.entity.Attributes || [])].sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));

      for (const attribute of attributes) {
        if (!attribute.OptionSet?.Options?.length) {
          continue;
        }

        const options = [...attribute.OptionSet.Options].sort((a, b) => a.Value - b.Value);
        for (const option of options) {
          rows.push([
            { value: blueprint.entity.LogicalName },
            { value: attribute.LogicalName },
            { value: getLabel(attribute.DisplayName) },
            { value: option.Value },
            { value: getLabel(option.Label) },
            { value: option.Color || '' },
          ]);
        }
      }
    }

    return {
      name: 'Option Sets',
      columns: [24, 26, 24, 12, 26, 12],
      rows,
    };
  }

  private buildKeysSheet(result: BlueprintResult): SheetDefinition {
    const rows: Cell[][] = [
      toHeaderRow([
        'Table Logical Name',
        'Key Name',
        'Display Name',
        'Columns',
        'Index Status',
      ]),
    ];

    const sortedEntities = [...result.entities].sort((a, b) => a.entity.LogicalName.localeCompare(b.entity.LogicalName));

    for (const blueprint of sortedEntities) {
      const keys = [...(blueprint.entity.Keys || [])].sort((a, b) => a.LogicalName.localeCompare(b.LogicalName));
      for (const key of keys) {
        rows.push([
          { value: blueprint.entity.LogicalName },
          { value: key.LogicalName },
          { value: getLabel(key.DisplayName) },
          { value: key.KeyAttributes.join(', ') },
          { value: key.EntityKeyIndexStatus || '' },
        ]);
      }
    }

    return {
      name: 'Alternate Keys',
      columns: [24, 30, 26, 40, 20],
      rows,
    };
  }

  private countRelationships(entities: EntityBlueprint[]): number {
    let total = 0;
    for (const entity of entities) {
      total += entity.entity.ManyToOneRelationships?.length || 0;
      total += entity.entity.OneToManyRelationships?.length || 0;
      total += entity.entity.ManyToManyRelationships?.length || 0;
    }
    return total;
  }

  private countOptionSetValues(entities: EntityBlueprint[]): number {
    let total = 0;
    for (const entity of entities) {
      for (const attribute of entity.entity.Attributes || []) {
        total += attribute.OptionSet?.Options?.length || 0;
      }
    }
    return total;
  }

  private countAlternateKeys(entities: EntityBlueprint[]): number {
    return entities.reduce((sum, entity) => sum + (entity.entity.Keys?.length || 0), 0);
  }

  private mapManyToOne(rel: ManyToOneRelationship): RelationshipRow {
    return {
      name: rel.SchemaName,
      type: 'Many-to-One',
      parentTable: rel.ReferencedEntity,
      childTable: rel.ReferencingEntity,
      parentColumn: rel.ReferencedAttribute,
      childColumn: rel.ReferencingAttribute,
      custom: toYesNo(rel.IsCustomRelationship),
      managed: toYesNo(rel.IsManaged),
    };
  }

  private mapOneToMany(rel: OneToManyRelationship): RelationshipRow {
    return {
      name: rel.SchemaName,
      type: 'One-to-Many',
      parentTable: rel.ReferencedEntity,
      childTable: rel.ReferencingEntity,
      parentColumn: rel.ReferencedAttribute,
      childColumn: rel.ReferencingAttribute,
      custom: toYesNo(rel.IsCustomRelationship),
      managed: toYesNo(rel.IsManaged),
    };
  }

  private mapManyToMany(rel: ManyToManyRelationship): RelationshipRow {
    return {
      name: rel.SchemaName,
      type: 'Many-to-Many',
      parentTable: rel.Entity1LogicalName,
      childTable: rel.Entity2LogicalName,
      parentColumn: rel.Entity1IntersectAttribute,
      childColumn: rel.Entity2IntersectAttribute,
      custom: toYesNo(rel.IsCustomRelationship),
      managed: toYesNo(rel.IsManaged),
    };
  }
}

function toHeaderRow(headers: string[]): Cell[] {
  return headers.map((header) => ({ value: header, styleId: 1 }));
}

function getLabel(
  labelSource:
    | DetailedEntityMetadata['DisplayName']
    | DetailedEntityMetadata['Description']
    | AttributeMetadata['DisplayName']
    | AttributeMetadata['Description']
    | EntityKey['DisplayName']
    | { UserLocalizedLabel?: { Label: string } }
    | undefined
): string {
  return labelSource?.UserLocalizedLabel?.Label || '';
}

function toYesNo(value: boolean | undefined): string {
  if (value === undefined) {
    return '';
  }

  return value ? 'Yes' : 'No';
}

function toScalar(value: number | { Value: number } | undefined): number | string {
  if (value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return value;
  }

  return value.Value;
}

function keyRelationship(row: RelationshipRow): string {
  return [
    row.name,
    row.type,
    row.parentTable,
    row.childTable,
    row.parentColumn,
    row.childColumn,
  ].join('|').toLowerCase();
}

function buildWorksheetXml(sheet: SheetDefinition, sharedStrings: SharedStringTable): string {
  const maxColumn = sheet.rows.reduce((max, row) => Math.max(max, row.length), 0);
  const lastCell = `${columnName(maxColumn - 1)}${Math.max(sheet.rows.length, 1)}`;
  const autoFilter = maxColumn > 0 && sheet.rows.length > 0
    ? `<autoFilter ref=\"A1:${columnName(maxColumn - 1)}1\"/>`
    : '';

  const cols = sheet.columns
    .map((width, index) => `<col min=\"${index + 1}\" max=\"${index + 1}\" width=\"${width}\" customWidth=\"1\"/>`)
    .join('');

  const rowsXml = sheet.rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cellsXml = row
        .map((cell, cellIndex) => buildCellXml(cell, `${columnName(cellIndex)}${rowNumber}`, sharedStrings))
        .join('');

      return `<row r=\"${rowNumber}\">${cellsXml}</row>`;
    })
    .join('');

  return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">
  <dimension ref=\"A1:${lastCell}\"/>
  <sheetViews><sheetView workbookViewId=\"0\"/></sheetViews>
  <sheetFormatPr defaultRowHeight=\"15\"/>
  <cols>${cols}</cols>
  <sheetData>${rowsXml}</sheetData>
  ${autoFilter}
</worksheet>`;
}

function buildCellXml(cell: Cell, reference: string, sharedStrings: SharedStringTable): string {
  const styleAttribute = cell.styleId !== undefined ? ` s=\"${cell.styleId}\"` : '';

  if (cell.value === null || cell.value === undefined || cell.value === '') {
    return `<c r=\"${reference}\"${styleAttribute}/>`;
  }

  if (typeof cell.value === 'number') {
    return `<c r=\"${reference}\"${styleAttribute}><v>${cell.value}</v></c>`;
  }

  if (typeof cell.value === 'boolean') {
    return `<c r=\"${reference}\" t=\"b\"${styleAttribute}><v>${cell.value ? 1 : 0}</v></c>`;
  }

  const index = sharedStrings.getIndex(cell.value);
  return `<c r=\"${reference}\" t=\"s\"${styleAttribute}><v>${index}</v></c>`;
}

function columnName(index: number): string {
  let value = index;
  let name = '';

  while (value >= 0) {
    name = String.fromCharCode((value % 26) + 65) + name;
    value = Math.floor(value / 26) - 1;
  }

  return name;
}

function buildWorkbookXml(sheets: SheetDefinition[]): string {
  const sheetXml = sheets
    .map((sheet, index) => `<sheet name=\"${escapeXml(sheet.name)}\" sheetId=\"${index + 1}\" r:id=\"rId${index + 1}\"/>`)
    .join('');

  return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\">
  <workbookPr/>
  <bookViews><workbookView/></bookViews>
  <sheets>${sheetXml}</sheets>
  <calcPr calcId=\"171027\"/>
</workbook>`;
}

function buildWorkbookRelsXml(sheetCount: number): string {
  const sheetRels = Array.from({ length: sheetCount }, (_, index) =>
    `<Relationship Id=\"rId${index + 1}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet${index + 1}.xml\"/>`
  ).join('');

  const styleRelId = sheetCount + 1;
  const sharedStringsRelId = sheetCount + 2;

  return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  ${sheetRels}
  <Relationship Id=\"rId${styleRelId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>
  <Relationship Id=\"rId${sharedStringsRelId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings\" Target=\"sharedStrings.xml\"/>
</Relationships>`;
}

function buildContentTypesXml(sheetCount: number): string {
  const sheetOverrides = Array.from({ length: sheetCount }, (_, index) =>
    `<Override PartName=\"/xl/worksheets/sheet${index + 1}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>`
  ).join('');

  return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\">
  <Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/>
  <Default Extension=\"xml\" ContentType=\"application/xml\"/>
  <Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/>
  ${sheetOverrides}
  <Override PartName=\"/xl/styles.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\"/>
  <Override PartName=\"/xl/sharedStrings.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml\"/>
  <Override PartName=\"/docProps/core.xml\" ContentType=\"application/vnd.openxmlformats-package.core-properties+xml\"/>
  <Override PartName=\"/docProps/app.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.extended-properties+xml\"/>
</Types>`;
}

function escapeXml(value: string): string {
  return sanitizeXmlText(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeCellText(value: string): string {
  const withoutInvalidChars = sanitizeXmlText(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (withoutInvalidChars.length <= 32767) {
    return withoutInvalidChars;
  }

  return withoutInvalidChars.slice(0, 32767);
}

function sanitizeXmlText(value: string): string {
  let output = '';

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const isAllowedControl = code === 0x09 || code === 0x0A || code === 0x0D;
    const isAllowedRange =
      (code >= 0x20 && code <= 0xD7FF) ||
      (code >= 0xE000 && code <= 0xFFFD);

    if (isAllowedControl || isAllowedRange) {
      output += value[i];
    }
  }

  return output;
}

function buildRootRelsXml(): string {
  return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">
  <Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/>
  <Relationship Id=\"rId2\" Type=\"http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties\" Target=\"docProps/core.xml\"/>
  <Relationship Id=\"rId3\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties\" Target=\"docProps/app.xml\"/>
</Relationships>`;
}

function buildCorePropsXml(date: Date): string {
  const iso = date.toISOString();
  return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<cp:coreProperties xmlns:cp=\"http://schemas.openxmlformats.org/package/2006/metadata/core-properties\" xmlns:dc=\"http://purl.org/dc/elements/1.1/\" xmlns:dcterms=\"http://purl.org/dc/terms/\" xmlns:dcmitype=\"http://purl.org/dc/dcmitype/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">
  <dc:creator>Power Platform Solution Blueprint Generator</dc:creator>
  <cp:lastModifiedBy>Power Platform Solution Blueprint Generator</cp:lastModifiedBy>
  <dcterms:created xsi:type=\"dcterms:W3CDTF\">${iso}</dcterms:created>
  <dcterms:modified xsi:type=\"dcterms:W3CDTF\">${iso}</dcterms:modified>
</cp:coreProperties>`;
}

function buildAppPropsXml(sheets: SheetDefinition[]): string {
  const sheetCount = sheets.length;
  const titles = sheets.map((sheet) => `<vt:lpstr>${escapeXml(sheet.name)}</vt:lpstr>`).join('');

  return `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<Properties xmlns=\"http://schemas.openxmlformats.org/officeDocument/2006/extended-properties\" xmlns:vt=\"http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes\">
  <Application>Power Platform Solution Blueprint Generator</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size=\"2\" baseType=\"variant\">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>${sheetCount}</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size=\"${sheetCount}\" baseType=\"lpstr\">${titles}</vt:vector>
  </TitlesOfParts>
  <Company></Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>1.0</AppVersion>
</Properties>`;
}

const STYLES_XML = `<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>
<styleSheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\">
  <fonts count=\"2\">
    <font><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>
    <font><b/><sz val=\"11\"/><name val=\"Calibri\"/><family val=\"2\"/></font>
  </fonts>
  <fills count=\"3\">
    <fill><patternFill patternType=\"none\"/></fill>
    <fill><patternFill patternType=\"gray125\"/></fill>
    <fill><patternFill patternType=\"solid\"><fgColor rgb=\"FFD9E1F2\"/><bgColor indexed=\"64\"/></patternFill></fill>
  </fills>
  <borders count=\"1\"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count=\"1\"><xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\"/></cellStyleXfs>
  <cellXfs count=\"3\">
    <xf numFmtId=\"0\" fontId=\"0\" fillId=\"0\" borderId=\"0\" xfId=\"0\"/>
    <xf numFmtId=\"0\" fontId=\"1\" fillId=\"2\" borderId=\"0\" xfId=\"0\" applyFont=\"1\" applyFill=\"1\"/>
    <xf numFmtId=\"0\" fontId=\"1\" fillId=\"0\" borderId=\"0\" xfId=\"0\" applyFont=\"1\"/>
  </cellXfs>
  <cellStyles count=\"1\"><cellStyle name=\"Normal\" xfId=\"0\" builtinId=\"0\"/></cellStyles>
  <dxfs count=\"0\"/>
  <tableStyles count=\"0\" defaultTableStyle=\"TableStyleMedium2\" defaultPivotStyle=\"PivotStyleLight16\"/>
</styleSheet>`;
