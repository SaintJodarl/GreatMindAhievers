import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { deflateRawSync } from 'zlib';
import {
  assertOfficialMemberRegisterFieldAlignment,
  OFFICIAL_MEMBER_REGISTER_FIELD_DEFINITIONS,
  OFFICIAL_MEMBER_REGISTER_FIELD_NAMES,
} from '@/lib/registration/account-registration-fields';

const COMPANY_NAME = 'Great Mind Achievers';
const REPORT_TITLE = 'Official Member Register';
const WORKSHEET_NAME = 'Official Register';
const TIME_ZONE = 'Africa/Lagos';
const HEADER_ROW = 8;
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MEMBER_BATCH_SIZE = 1000;
const MAX_BATCH_SIZE = 5000;

export const MAX_EXCEL_DATA_ROWS = 1_048_576 - HEADER_ROW;

// Mirrors src/app/sign-up-login-screen/components/RegisterForm.tsx.
// Password, confirmPassword, and non-persisted agreeTerms are intentionally excluded.
export const officialMemberRegisterSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  createdAt: true,
  name: true,
  email: true,
  username: true,
  bankName: true,
  accountNumber: true,
  accountName: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      gender: true,
      state: true,
      address: true,
    },
  },
  kycSubmission: {
    select: {
      fullName: true,
      phone: true,
      gender: true,
      state: true,
      address: true,
    },
  },
  sponsor: {
    select: {
      referralCode: true,
    },
  },
  activationCode: {
    select: {
      code: true,
    },
  },
});

export type OfficialMemberRegisterMember = Prisma.UserGetPayload<{
  select: typeof officialMemberRegisterSelect;
}>;

type OfficialMemberRegisterColumnKey = (typeof OFFICIAL_MEMBER_REGISTER_FIELD_NAMES)[number];

export type OfficialMemberRegisterRow = Record<OfficialMemberRegisterColumnKey, string>;

interface OfficialMemberRegisterColumn {
  key: OfficialMemberRegisterColumnKey;
  header: string;
  formField: OfficialMemberRegisterColumnKey;
  source: string;
}

export const OFFICIAL_MEMBER_REGISTER_COLUMNS = OFFICIAL_MEMBER_REGISTER_FIELD_DEFINITIONS.map(
  (field) => ({
    key: field.name,
    header: field.label,
    formField: field.name,
    source: field.prismaSource || '',
  })
) as readonly OfficialMemberRegisterColumn[];

const SENSITIVE_EXPORT_PATTERN =
  /(password|hash|salt|token|otp|mfa|secret|session|jwt|api[\s_-]*key|credential)/i;

function assertNoSensitiveColumns() {
  assertOfficialMemberRegisterFieldAlignment();

  const duplicateHeaders = findDuplicates(
    OFFICIAL_MEMBER_REGISTER_COLUMNS.map((column) => column.header)
  );
  if (duplicateHeaders.length > 0) {
    throw new Error(
      `Official member register includes duplicate column headers: ${duplicateHeaders.join(', ')}`
    );
  }

  const sensitiveColumns = OFFICIAL_MEMBER_REGISTER_COLUMNS.filter(
    (column) =>
      SENSITIVE_EXPORT_PATTERN.test(column.header) ||
      SENSITIVE_EXPORT_PATTERN.test(column.formField) ||
      SENSITIVE_EXPORT_PATTERN.test(column.source)
  );

  if (sensitiveColumns.length > 0) {
    throw new Error(
      `Official member register includes sensitive column definitions: ${sensitiveColumns
        .map((column) => column.header)
        .join(', ')}`
    );
  }

  const missingSources = OFFICIAL_MEMBER_REGISTER_COLUMNS.filter((column) => !column.source);
  if (missingSources.length > 0) {
    throw new Error(
      `Official member register fields are missing Prisma source definitions: ${missingSources
        .map((column) => column.header)
        .join(', ')}`
    );
  }

  const selectedSensitiveFields = getSelectedFieldPaths(officialMemberRegisterSelect).filter(
    (fieldPath) => SENSITIVE_EXPORT_PATTERN.test(fieldPath)
  );

  if (selectedSensitiveFields.length > 0) {
    throw new Error(
      `Official member register selects sensitive database fields: ${selectedSensitiveFields.join(
        ', '
      )}`
    );
  }
}

function getSelectedFieldPaths(select: Record<string, unknown>, prefix = ''): string[] {
  const fieldPaths: string[] = [];

  Object.entries(select).forEach(([key, value]) => {
    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (value === true) {
      fieldPaths.push(fieldPath);
      return;
    }

    if (value && typeof value === 'object' && 'select' in value) {
      fieldPaths.push(
        ...getSelectedFieldPaths((value as { select: Record<string, unknown> }).select, fieldPath)
      );
    }
  });

  return fieldPaths;
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }

    seen.add(value);
  });

  return [...duplicates];
}

interface BuildWorkbookOptions {
  rows: OfficialMemberRegisterRow[];
  generatedAt: Date;
  generatedBy: string;
  companyName?: string;
  timeZone?: string;
}

interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface ZipEntryInput {
  path: string;
  content: string | Buffer;
}

export function mapOfficialMemberRegisterRow(
  member: OfficialMemberRegisterMember
): OfficialMemberRegisterRow {
  const fallbackName = splitName(member.kycSubmission?.fullName || member.name);

  return {
    firstName: cleanCellValue(member.profile?.firstName) || fallbackName.firstName,
    lastName: cleanCellValue(member.profile?.lastName) || fallbackName.lastName,
    username: cleanCellValue(member.username),
    phone: cleanCellValue(member.profile?.phone ?? member.kycSubmission?.phone),
    email: cleanCellValue(member.email),
    gender: cleanCellValue(member.profile?.gender ?? member.kycSubmission?.gender),
    state: cleanCellValue(member.profile?.state ?? member.kycSubmission?.state),
    address: cleanCellValue(member.profile?.address ?? member.kycSubmission?.address),
    bankName: cleanCellValue(member.bankName),
    accountNumber: cleanCellValue(member.accountNumber),
    accountName: cleanCellValue(member.accountName),
    sponsorCode: cleanCellValue(member.sponsor?.referralCode),
    activationCode: cleanCellValue(member.activationCode?.code),
  };
}

export async function loadOfficialMemberRegisterRows(
  prisma: PrismaClient,
  batchSize = MEMBER_BATCH_SIZE
): Promise<OfficialMemberRegisterRow[]> {
  assertNoSensitiveColumns();

  const safeBatchSize = Math.min(Math.max(1, batchSize), MAX_BATCH_SIZE);
  const rows: OfficialMemberRegisterRow[] = [];
  let cursor: Pick<OfficialMemberRegisterMember, 'id' | 'createdAt'> | null = null;

  for (;;) {
    const where: Prisma.UserWhereInput = cursor
      ? {
          role: 'MEMBER',
          OR: [
            { createdAt: { gt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { gt: cursor.id } },
          ],
        }
      : { role: 'MEMBER' };

    const members = await prisma.user.findMany({
      where,
      select: officialMemberRegisterSelect,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: safeBatchSize,
    });

    if (rows.length + members.length > MAX_EXCEL_DATA_ROWS) {
      const error = new Error(
        `Export is too large for one Excel worksheet. Maximum supported members: ${MAX_EXCEL_DATA_ROWS}.`
      ) as Error & { statusCode?: number };
      error.statusCode = 413;
      throw error;
    }

    rows.push(...members.map(mapOfficialMemberRegisterRow));

    if (members.length < safeBatchSize) {
      break;
    }

    const lastMember = members[members.length - 1];
    cursor = { id: lastMember.id, createdAt: lastMember.createdAt };
  }

  return rows;
}

export function buildOfficialMemberRegisterWorkbook({
  rows,
  generatedAt,
  generatedBy,
  companyName = COMPANY_NAME,
  timeZone = TIME_ZONE,
}: BuildWorkbookOptions): Buffer {
  assertNoSensitiveColumns();

  const worksheetXml = buildWorksheetXml({
    rows,
    generatedAt,
    generatedBy,
    companyName,
    timeZone,
  });

  const creator = generatedBy || 'Administrator';
  const entries: ZipEntryInput[] = [
    { path: '[Content_Types].xml', content: contentTypesXml() },
    { path: '_rels/.rels', content: packageRelationshipsXml() },
    { path: 'docProps/core.xml', content: corePropertiesXml(generatedAt, creator) },
    { path: 'docProps/app.xml', content: appPropertiesXml(companyName) },
    { path: 'xl/workbook.xml', content: workbookXml() },
    { path: 'xl/_rels/workbook.xml.rels', content: workbookRelationshipsXml() },
    { path: 'xl/styles.xml', content: stylesXml() },
    { path: 'xl/worksheets/sheet1.xml', content: worksheetXml },
  ];

  return createZip(entries, generatedAt);
}

export function formatOfficialMemberRegisterFileName(date: Date, timeZone = TIME_ZONE): string {
  return `Official_Member_Register_${formatDateForFile(date, timeZone)}.xlsx`;
}

export function formatGeneratedDate(date: Date, timeZone = TIME_ZONE): string {
  const parts = getZonedDateTimeParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function formatGeneratedTime(date: Date, timeZone = TIME_ZONE): string {
  const parts = getZonedDateTimeParts(date, timeZone);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

function buildWorksheetXml({
  rows,
  generatedAt,
  generatedBy,
  companyName,
  timeZone,
}: Required<BuildWorkbookOptions>): string {
  const lastColumnIndex = OFFICIAL_MEMBER_REGISTER_COLUMNS.length;
  const lastColumnName = getColumnName(lastColumnIndex);
  const dataEndRow = HEADER_ROW + rows.length;
  const dimensionEndRow = Math.max(dataEndRow, HEADER_ROW);
  const autoFilterEndRow = Math.max(dataEndRow, HEADER_ROW);
  const widths = calculateColumnWidths(rows);
  const generatedParts = getZonedDateTimeParts(generatedAt, timeZone);
  const generatedDateSerial = toExcelDateSerial(generatedParts);
  const generatedTimeSerial = toExcelTimeSerial(generatedParts);

  const worksheetRows: string[] = [
    rowXml(1, [textCell(1, 1, companyName, 3)], 26),
    rowXml(2, [textCell(1, 2, REPORT_TITLE, 4)], 22),
    rowXml(3, [textCell(1, 3, 'Generated Date', 1), numberCell(2, 3, generatedDateSerial, 8)]),
    rowXml(4, [textCell(1, 4, 'Generated Time', 1), numberCell(2, 4, generatedTimeSerial, 9)]),
    rowXml(5, [textCell(1, 5, 'Generated By', 1), textCell(2, 5, generatedBy, 2)]),
    rowXml(6, [textCell(1, 6, 'Total Registered Members', 1), numberCell(2, 6, rows.length, 10)]),
    '<row r="7"/>',
    rowXml(
      HEADER_ROW,
      OFFICIAL_MEMBER_REGISTER_COLUMNS.map((column, index) =>
        textCell(index + 1, HEADER_ROW, column.header, 5)
      ),
      24
    ),
  ];

  rows.forEach((dataRow, dataIndex) => {
    const rowNumber = HEADER_ROW + dataIndex + 1;
    const dataStyle = dataIndex % 2 === 0 ? 6 : 7;
    worksheetRows.push(
      rowXml(
        rowNumber,
        OFFICIAL_MEMBER_REGISTER_COLUMNS.map((column, columnIndex) =>
          textCell(columnIndex + 1, rowNumber, dataRow[column.key], dataStyle)
        )
      )
    );
  });

  return xmlDeclaration(`\
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetPr>
    <pageSetUpPr fitToPage="1"/>
  </sheetPr>
  <dimension ref="A1:${lastColumnName}${dimensionEndRow}"/>
  <sheetViews>
    <sheetView workbookViewId="0">
      <pane ySplit="${HEADER_ROW}" topLeftCell="A${HEADER_ROW + 1}" activePane="bottomLeft" state="frozen"/>
      <selection pane="bottomLeft" activeCell="A${HEADER_ROW + 1}" sqref="A${HEADER_ROW + 1}"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="16"/>
  <cols>
    ${widths
      .map(
        (width, index) =>
          `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
      )
      .join('\n    ')}
  </cols>
  <sheetData>
    ${worksheetRows.join('\n    ')}
  </sheetData>
  <mergeCells count="2">
    <mergeCell ref="A1:${lastColumnName}1"/>
    <mergeCell ref="A2:${lastColumnName}2"/>
  </mergeCells>
  <autoFilter ref="A${HEADER_ROW}:${lastColumnName}${autoFilterEndRow}"/>
  <pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
  <pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`);
}

function calculateColumnWidths(rows: OfficialMemberRegisterRow[]): number[] {
  const widths = OFFICIAL_MEMBER_REGISTER_COLUMNS.map((column) => column.header.length);
  widths[0] = Math.max(widths[0], 24);
  widths[1] = Math.max(widths[1], 30);

  rows.forEach((row) => {
    OFFICIAL_MEMBER_REGISTER_COLUMNS.forEach((column, index) => {
      widths[index] = Math.max(widths[index], getDisplayLength(row[column.key]));
    });
  });

  return widths.map((width, index) => {
    const maxWidth = OFFICIAL_MEMBER_REGISTER_COLUMNS[index].key === 'address' ? 48 : 36;
    return Math.min(Math.max(width + 2, 12), maxWidth);
  });
}

function rowXml(rowNumber: number, cells: string[], height?: number): string {
  const heightAttrs = height ? ` ht="${height}" customHeight="1"` : '';
  return `<row r="${rowNumber}"${heightAttrs}>${cells.join('')}</row>`;
}

function textCell(columnIndex: number, rowNumber: number, value: string, styleId: number): string {
  const ref = `${getColumnName(columnIndex)}${rowNumber}`;
  return `<c r="${ref}" s="${styleId}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
}

function numberCell(
  columnIndex: number,
  rowNumber: number,
  value: number,
  styleId: number
): string {
  const ref = `${getColumnName(columnIndex)}${rowNumber}`;
  return `<c r="${ref}" s="${styleId}"><v>${value}</v></c>`;
}

function workbookXml(): string {
  return xmlDeclaration(`\
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews>
    <workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="17600"/>
  </bookViews>
  <sheets>
    <sheet name="${xmlAttributeEscape(WORKSHEET_NAME)}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`);
}

function stylesXml(): string {
  return xmlDeclaration(`\
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="yyyy-mm-dd"/>
    <numFmt numFmtId="165" formatCode="hh:mm:ss"/>
  </numFmts>
  <fonts count="5">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="16"/><color rgb="FF111827"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="13"/><color rgb="FF374151"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1F2937"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE5E7EB"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF8FAFC"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="11">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`);
}

function contentTypesXml(): string {
  return xmlDeclaration(`\
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);
}

function packageRelationshipsXml(): string {
  return xmlDeclaration(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`);
}

function workbookRelationshipsXml(): string {
  return xmlDeclaration(`\
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
}

function corePropertiesXml(generatedAt: Date, creator: string): string {
  const timestamp = generatedAt.toISOString();
  const safeCreator = xmlEscape(creator);
  return xmlDeclaration(`\
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${xmlEscape(REPORT_TITLE)}</dc:title>
  <dc:creator>${safeCreator}</dc:creator>
  <cp:lastModifiedBy>${safeCreator}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified>
</cp:coreProperties>`);
}

function appPropertiesXml(companyName: string): string {
  return xmlDeclaration(`\
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Great Mind Achievers Admin</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs>
    <vt:vector size="2" baseType="variant">
      <vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant>
      <vt:variant><vt:i4>1</vt:i4></vt:variant>
    </vt:vector>
  </HeadingPairs>
  <TitlesOfParts>
    <vt:vector size="1" baseType="lpstr">
      <vt:lpstr>${xmlEscape(WORKSHEET_NAME)}</vt:lpstr>
    </vt:vector>
  </TitlesOfParts>
  <Company>${xmlEscape(companyName)}</Company>
  <LinksUpToDate>false</LinksUpToDate>
  <SharedDoc>false</SharedDoc>
  <HyperlinksChanged>false</HyperlinksChanged>
  <AppVersion>16.0300</AppVersion>
</Properties>`);
}

function xmlDeclaration(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n${body}`;
}

function xmlEscape(value: string): string {
  return removeInvalidXmlChars(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlAttributeEscape(value: string): string {
  return xmlEscape(value);
}

function cleanCellValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  return removeInvalidXmlChars(String(value)).replace(/\r?\n/g, ' ').trim();
}

function splitName(value: string | null | undefined): { firstName: string; lastName: string } {
  const parts = cleanCellValue(value).split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function removeInvalidXmlChars(value: string): string {
  let cleaned = '';

  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    const isInvalidXmlControl =
      (codePoint >= 0x00 && codePoint <= 0x08) ||
      codePoint === 0x0b ||
      codePoint === 0x0c ||
      (codePoint >= 0x0e && codePoint <= 0x1f);

    if (!isInvalidXmlControl) {
      cleaned += character;
    }
  }

  return cleaned;
}

function getDisplayLength(value: string): number {
  return value.replace(/\s+/g, ' ').trim().length;
}

function getColumnName(index: number): string {
  let column = '';
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}

function getZonedDateTimeParts(date: Date, timeZone: string): ZonedDateTimeParts {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);
  const valueFor = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    return value ? parseInt(value, 10) : 0;
  };

  return {
    year: valueFor('year'),
    month: valueFor('month'),
    day: valueFor('day'),
    hour: valueFor('hour'),
    minute: valueFor('minute'),
    second: valueFor('second'),
  };
}

function formatDateForFile(date: Date, timeZone: string): string {
  const parts = getZonedDateTimeParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function toExcelDateSerial(parts: ZonedDateTimeParts): number {
  const utcDate = Date.UTC(parts.year, parts.month - 1, parts.day);
  return (utcDate - EXCEL_EPOCH_UTC) / MS_PER_DAY;
}

function toExcelTimeSerial(parts: ZonedDateTimeParts): number {
  return (parts.hour * 3600 + parts.minute * 60 + parts.second) / 86400;
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

const CRC_TABLE = createCrc32Table();

function createZip(entries: ZipEntryInput[], date: Date): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  const { dosDate, dosTime } = getDosDateTime(date);

  entries.forEach((entry) => {
    const nameBuffer = Buffer.from(entry.path, 'utf8');
    const contentBuffer = Buffer.isBuffer(entry.content)
      ? entry.content
      : Buffer.from(entry.content, 'utf8');
    const compressedBuffer = deflateRawSync(contentBuffer, { level: 6 });
    const checksum = crc32(contentBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(compressedBuffer.length, 18);
    localHeader.writeUInt32LE(contentBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, compressedBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(compressedBuffer.length, 20);
    centralHeader.writeUInt32LE(contentBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + compressedBuffer.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endRecord]);
}

function getDosDateTime(date: Date): { dosDate: number; dosTime: number } {
  const year = Math.max(date.getFullYear(), 1980);
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  return { dosDate, dosTime };
}

function createCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
