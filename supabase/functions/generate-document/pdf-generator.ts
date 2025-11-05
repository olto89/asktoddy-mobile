import puppeteer from 'puppeteer';
import type { DocumentRequest, DocumentResponse } from './types.ts';
import { generateQuoteHTML, generateTimelineHTML, generateTaskListHTML } from './templates.ts';

export class PDFGenerator {
  private static async getBrowser() {
    return await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });
  }

  static async generatePDF(request: DocumentRequest): Promise<DocumentResponse> {
    const startTime = Date.now();
    let browser;

    try {
      console.log(`📄 Generating ${request.type} PDF for ${request.projectType}`);

      // Generate HTML content based on document type
      let htmlContent: string;
      switch (request.type) {
        case 'quote':
          htmlContent = generateQuoteHTML(request);
          break;
        case 'timeline':
          htmlContent = generateTimelineHTML(request);
          break;
        case 'tasklist':
          htmlContent = generateTaskListHTML(request);
          break;
        default:
          throw new Error(`Unsupported document type: ${request.type}`);
      }

      // Launch browser and create PDF
      browser = await PDFGenerator.getBrowser();
      const page = await browser.newPage();

      // Set content and wait for any images/styles to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Configure PDF options
      const pdfOptions = {
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px',
        },
        displayHeaderFooter: false,
      };

      // Generate PDF buffer
      const pdfBuffer = await page.pdf(pdfOptions);
      await browser.close();

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;

      // Create filename
      const dateStr = new Date().toISOString().split('T')[0];
      const projectName = request.projectType.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${projectName}-${request.type}-${dateStr}.pdf`;

      // Create document metadata
      const documentId = `doc_${request.type}_${Date.now()}`;
      const size = `${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB`;
      const pages = await PDFGenerator.countPages(pdfBuffer);

      const response: DocumentResponse = {
        success: true,
        document: {
          documentId,
          type: request.type,
          filename,
          downloadUrl: `https://api.asktoddy.com/documents/${documentId}.pdf`, // This would be updated with actual storage URL
          size,
          pages,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
        pdfBuffer: new Uint8Array(pdfBuffer),
        message: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} document generated successfully`,
        processingTimeMs,
      };

      console.log(`✅ PDF generated successfully in ${processingTimeMs}ms`);
      return response;
    } catch (error) {
      if (browser) {
        await browser.close();
      }

      console.error('PDF Generation Error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  private static async countPages(pdfBuffer: Buffer): Promise<number> {
    // Simple page count estimation based on PDF structure
    // For a more accurate count, you could use a PDF parsing library
    const pdfText = pdfBuffer.toString('binary');
    const pageMatches = pdfText.match(/\/Type\s*\/Page[^s]/g);
    return pageMatches ? pageMatches.length : 1;
  }

  // Helper method to validate document request
  static validateRequest(request: DocumentRequest): void {
    if (!request.type || !['quote', 'timeline', 'tasklist'].includes(request.type)) {
      throw new Error('Invalid document type. Must be one of: quote, timeline, tasklist');
    }

    if (!request.projectType || request.projectType.trim().length === 0) {
      throw new Error('Project type is required');
    }

    if (!request.analysis) {
      throw new Error('Analysis data is required');
    }

    if (!request.analysis.costBreakdown) {
      throw new Error('Cost breakdown is required');
    }

    if (!request.analysis.timeline) {
      throw new Error('Timeline data is required');
    }

    // Validate cost breakdown structure
    const { costBreakdown } = request.analysis;
    if (
      !Array.isArray(costBreakdown.materials) ||
      !Array.isArray(costBreakdown.labour) ||
      !Array.isArray(costBreakdown.tools)
    ) {
      throw new Error('Invalid cost breakdown structure');
    }

    if (typeof costBreakdown.total !== 'number' || costBreakdown.total < 0) {
      throw new Error('Invalid total cost');
    }

    // Validate timeline structure
    const { timeline } = request.analysis;
    if (!Array.isArray(timeline.phases) || timeline.phases.length === 0) {
      throw new Error('Timeline must have at least one phase');
    }

    if (!timeline.totalDuration || timeline.totalDuration.trim().length === 0) {
      throw new Error('Total duration is required');
    }
  }
}
