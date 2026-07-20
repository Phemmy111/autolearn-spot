export const config = { runtime: 'edge' };

// Function to generate the PNG using next/og
export async function generateCertificatePNG(name: string, date: string, logoUrl?: string): Promise<Buffer> {
  const imageResponse = new ImageResponse(
    (
      <CertificateTemplate name={name} date={date} logoUrl={logoUrl} />
    ),
    {
      width: 1200,
      height: 800,
    }
  );

  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Function to generate PDF using pdf-lib (always embed PNG)
export async function generateCertificatePDF(name: string, date: string, logoUrl?: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([1200, 800]);

  // Embed PNG generated from the template
  const pngBuffer = await generateCertificatePNG(name, date, logoUrl);
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: 1200,
    height: 800,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
