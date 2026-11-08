/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KineticSimulationOutput, SimulationSummaryRow } from '../types/kineticModel';

/**
 * Escapes text for XML Spreadsheet format
 */
function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates an official Microsoft XML SpreadsheetML document (.xls) with 3 worksheets:
 * 1. Formulation_Summary
 * 2. Mass_Evaporation_Kinetics
 * 3. Odor_Value_OV_Curves
 * 
 * Matches Dar_AlKamalSmartBrain.py output structure perfectly.
 */
export function generateDarAlKamalExcelXml(simulation: KineticSimulationOutput): string {
  const { summaryRows, timeGridPoints, materials, calibratedK } = simulation;
  const initialMassMg = timeGridPoints[0]?.totalMass ?? 100;
  const finalMassMg = timeGridPoints[timeGridPoints.length - 1]?.totalMass ?? 10;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Dar Al-Kamal Smart Brain - Kinetic Odor Value Simulation</Title>
  <Subject>Perfumery Physical Chemistry Kinetics</Subject>
  <Author>Dar Al-Kamal Perfume Brain</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:CharSet="0" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#444444"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#444444"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#444444"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#444444"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#334155" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumberCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="ExpCell">
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
   <NumberFormat ss:Format="0.000E+00"/>
  </Style>
 </Styles>
`;

  // --- SHEET 1: Formulation_Summary ---
  xml += ` <Worksheet ss:Name="Formulation_Summary">
  <Table ss:DefaultColumnWidth="120" ss:DefaultRowHeight="20">
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="70"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>
   <Column ss:Width="100"/>
   <Column ss:Width="80"/>
   <Column ss:Width="160"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Material</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">CAS</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Parts</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">MW (g/mol)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">P0 (mmHg)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">ODT (ng/L)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">ODT Unit</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">ODT Source</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Confidence</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mole Fraction (x_i)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">P_partial (kPa)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Vapor Phase (%)</Data></Cell>
   </Row>
`;

  for (const row of summaryRows) {
    xml += `   <Row ss:Height="20">
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.material)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.cas)}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${row.parts}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${row.mw.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="ExpCell"><Data ss:Type="Number">${row.p0}</Data></Cell>
    <Cell ss:StyleID="ExpCell"><Data ss:Type="Number">${row.odt}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.odtUnit)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.odtSource)}</Data></Cell>
    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXml(row.confidence)}</Data></Cell>
    <Cell ss:StyleID="ExpCell"><Data ss:Type="Number">${row.moleFraction}</Data></Cell>
    <Cell ss:StyleID="ExpCell"><Data ss:Type="Number">${row.partialPressure}</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${row.vaporContributionPct.toFixed(2)}</Data></Cell>
   </Row>
`;
  }

  // Metadata rows
  xml += `   <Row ss:Height="15"/>
   <Row ss:Height="20">
    <Cell ss:StyleID="SubHeader"><Data ss:Type="String">Calibrated k</Data></Cell>
    <Cell ss:StyleID="ExpCell"><Data ss:Type="Number">${calibratedK}</Data></Cell>
    <Cell ss:StyleID="SubHeader"><Data ss:Type="String">Initial Mass (mg)</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${initialMassMg.toFixed(2)}</Data></Cell>
    <Cell ss:StyleID="SubHeader"><Data ss:Type="String">Final Mass (mg)</Data></Cell>
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${finalMassMg.toFixed(2)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

  // --- SHEET 2: Mass_Evaporation_Kinetics ---
  xml += ` <Worksheet ss:Name="Mass_Evaporation_Kinetics">
  <Table ss:DefaultColumnWidth="100" ss:DefaultRowHeight="20">
   <Column ss:Width="80"/>
`;
  for (let i = 0; i < materials.length; i++) {
    xml += `   <Column ss:Width="110"/>\n`;
  }
  xml += `   <Column ss:Width="120"/>\n`;

  // Header row
  xml += `   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Time (h)</Data></Cell>
`;
  for (const mat of materials) {
    xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(mat)} (mg)</Data></Cell>\n`;
  }
  xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Mass (mg)</Data></Cell>\n   </Row>\n`;

  // Data rows
  for (const pt of timeGridPoints) {
    xml += `   <Row ss:Height="20">
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${pt.timeHours.toFixed(2)}</Data></Cell>
`;
    for (const mat of materials) {
      const massVal = pt.materialsMass[mat] ?? 0;
      xml += `    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${massVal.toFixed(4)}</Data></Cell>\n`;
    }
    xml += `    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${pt.totalMass.toFixed(4)}</Data></Cell>\n   </Row>\n`;
  }

  xml += `  </Table>
 </Worksheet>
`;

  // --- SHEET 3: Odor_Value_OV_Curves ---
  xml += ` <Worksheet ss:Name="Odor_Value_OV_Curves">
  <Table ss:DefaultColumnWidth="110" ss:DefaultRowHeight="20">
   <Column ss:Width="80"/>
`;
  for (let i = 0; i < materials.length; i++) {
    xml += `   <Column ss:Width="110"/>\n`;
  }
  xml += `   <Column ss:Width="120"/>\n`;

  // Header row
  xml += `   <Row ss:Height="26">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Time (h)</Data></Cell>
`;
  for (const mat of materials) {
    xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(mat)} (OV)</Data></Cell>\n`;
  }
  xml += `    <Cell ss:StyleID="Header"><Data ss:Type="String">Total OV</Data></Cell>\n   </Row>\n`;

  // Data rows
  for (const pt of timeGridPoints) {
    const totalOv = Object.values(pt.materialsOv).reduce((acc, v) => acc + v, 0);
    xml += `   <Row ss:Height="20">
    <Cell ss:StyleID="NumberCell"><Data ss:Type="Number">${pt.timeHours.toFixed(2)}</Data></Cell>
`;
    for (const mat of materials) {
      const ovVal = pt.materialsOv[mat] ?? 0;
      xml += `    <Cell ss:StyleID="ExpCell"><Data ss:Type="Number">${ovVal}</Data></Cell>\n`;
    }
    xml += `    <Cell ss:StyleID="ExpCell"><Data ss:Type="Number">${totalOv}</Data></Cell>\n   </Row>\n`;
  }

  xml += `  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

/**
 * Triggers browser download of the multi-sheet Excel file (.xls)
 */
export function downloadDarAlKamalExcel(simulation: KineticSimulationOutput, filenamePrefix = 'Dar_AlKamal_Simulation'): void {
  const xmlContent = generateDarAlKamalExcelXml(simulation);
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
