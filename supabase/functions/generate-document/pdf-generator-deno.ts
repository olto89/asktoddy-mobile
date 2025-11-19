/**
 * PDF Generator for Deno/Edge Functions
 * Uses jsPDF for PDF generation (Deno compatible)
 */

import jsPDF from 'https://esm.sh/jspdf@2.5.1';
import type { DocumentRequest, DocumentResponse } from './types.ts';

export class PDFGenerator {
  static validateRequest(request: DocumentRequest): void {
    console.log('Validating request:', JSON.stringify(request, null, 2));
    
    if (!request.type) {
      throw new Error('Document type is required');
    }
    if (!['quote', 'timeline', 'tasklist'].includes(request.type)) {
      throw new Error(`Invalid document type: ${request.type}`);
    }
    if (!request.projectType) {
      throw new Error('Project type is required');
    }
    
    // Ensure analysis object exists and has basic structure
    if (!request.analysis) {
      console.log('No analysis object, creating minimal one');
      request.analysis = {
        projectType: request.projectType,
        description: 'Generated quote',
        costBreakdown: {
          materials: [],
          labour: [],
          tools: [],
          total: 0
        },
        timeline: {
          phases: [],
          totalDuration: 'TBD'
        },
        recommendations: [],
        confidence: 1.0,
        aiProvider: 'system',
        processingTimeMs: 0
      };
    }
    
    console.log('Request validation passed');
  }

  static async generatePDF(request: DocumentRequest): Promise<DocumentResponse> {
    const startTime = Date.now();

    try {
      console.log(`📄 Generating ${request.type} PDF for ${request.projectType}`);

      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set document properties
      doc.setProperties({
        title: `${request.projectType} - ${request.type}`,
        subject: `AskToddy ${request.type}`,
        author: 'AskToddy',
        keywords: 'construction, quote, planning',
        creator: 'AskToddy Mobile App',
      });

      // Add content based on document type
      switch (request.type) {
        case 'quote':
          this.generateQuotePDF(doc, request);
          break;
        case 'timeline':
          this.generateTimelinePDF(doc, request);
          break;
        case 'tasklist':
          this.generateTaskListPDF(doc, request);
          break;
        default:
          throw new Error(`Unsupported document type: ${request.type}`);
      }

      // Get PDF as array buffer
      const pdfOutput = doc.output('arraybuffer');
      const pdfBuffer = new Uint8Array(pdfOutput);

      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;

      // Create filename
      const dateStr = new Date().toISOString().split('T')[0];
      const projectName = request.projectType.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${projectName}-${request.type}-${dateStr}.pdf`;

      // Create document metadata
      const documentId = `doc_${request.type}_${Date.now()}`;
      const size = `${(pdfBuffer.length / 1024).toFixed(1)} KB`;
      const pages = doc.getNumberOfPages();

      const response: DocumentResponse = {
        success: true,
        document: {
          documentId,
          type: request.type,
          filename,
          downloadUrl: ``, // Will be filled by the calling function
          size,
          pages,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
        pdfBuffer,
        message: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} document generated successfully`,
        processingTimeMs,
      };

      console.log(`✅ PDF generated successfully in ${processingTimeMs}ms`);
      return response;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  private static generateQuotePDF(doc: any, request: DocumentRequest): void {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Colors
    const primaryColor = [255, 87, 34]; // Orange
    const textColor = [33, 33, 33];
    const lightGray = [200, 200, 200];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AskToddy', 10, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Quote', pageWidth - 50, 20);

    yPosition = 45;

    // Project Details
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(request.projectType || 'Construction Project', 10, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Quote Date: ${new Date().toLocaleDateString()}`, 10, yPosition);
    yPosition += 5;

    if (request.userDetails?.name) {
      doc.text(`Customer: ${request.userDetails.name}`, 10, yPosition);
      yPosition += 5;
    }

    if (request.userDetails?.location) {
      doc.text(`Location: ${request.userDetails.location}`, 10, yPosition);
      yPosition += 5;
    }

    yPosition += 10;

    // Cost Breakdown
    doc.setTextColor(...textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Cost Breakdown', 10, yPosition);
    yPosition += 8;

    // Table headers
    doc.setFillColor(...lightGray);
    doc.rect(10, yPosition - 5, pageWidth - 20, 8, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 12, yPosition);
    doc.text('Description', 60, yPosition);
    doc.text('Cost', pageWidth - 30, yPosition);
    yPosition += 10;

    // Add pricing items from analysis
    doc.setFont('helvetica', 'normal');
    const analysis = request.analysis;
    const costBreakdown = analysis?.costBreakdown;

    if (costBreakdown) {
      // Calculate totals
      const materialsTotal =
        costBreakdown.materials?.reduce((sum, item) => sum + item.total, 0) || 0;
      const labourTotal = costBreakdown.labour?.reduce((sum, item) => sum + item.total, 0) || 0;
      const toolsTotal = costBreakdown.tools?.reduce((sum, item) => sum + item.total, 0) || 0;

      if (materialsTotal > 0) {
        doc.text('Materials', 12, yPosition);
        doc.text('Construction materials and supplies', 60, yPosition);
        doc.text(`£${materialsTotal.toLocaleString()}`, pageWidth - 30, yPosition);
        yPosition += 8;
      }

      if (labourTotal > 0) {
        doc.text('Labour', 12, yPosition);
        doc.text('Professional installation and work', 60, yPosition);
        doc.text(`£${labourTotal.toLocaleString()}`, pageWidth - 30, yPosition);
        yPosition += 8;
      }

      if (toolsTotal > 0) {
        doc.text('Tool Hire', 12, yPosition);
        doc.text('Equipment and tool rental', 60, yPosition);
        doc.text(`£${toolsTotal.toLocaleString()}`, pageWidth - 30, yPosition);
        yPosition += 8;
      }

      const subtotal = materialsTotal + labourTotal + toolsTotal;
      const vatAmount = costBreakdown.vatAmount || subtotal * 0.2;

      if (vatAmount > 0) {
        doc.text('VAT (20%)', 12, yPosition);
        doc.text('Value Added Tax', 60, yPosition);
        doc.text(`£${vatAmount.toFixed(2)}`, pageWidth - 30, yPosition);
        yPosition += 8;
      }

      // Total line
      doc.setLineWidth(0.5);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Estimate:', 12, yPosition);
      doc.setTextColor(...primaryColor);
      const grandTotal = costBreakdown.grandTotal || subtotal + vatAmount;
      doc.text(`£${grandTotal.toFixed(2)}`, pageWidth - 30, yPosition);
    } else if (request.pricing) {
      // Fallback to pricing data if no cost breakdown
      const pricing = request.pricing;
      const materialsTotal =
        pricing.materials?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;
      const labourTotal =
        pricing.labour?.reduce((sum: number, item: any) => sum + (item.total || 0), 0) || 0;

      if (materialsTotal > 0) {
        doc.text('Materials', 12, yPosition);
        doc.text('Construction materials and supplies', 60, yPosition);
        doc.text(`£${materialsTotal.toLocaleString()}`, pageWidth - 30, yPosition);
        yPosition += 8;
      }

      if (labourTotal > 0) {
        doc.text('Labour', 12, yPosition);
        doc.text('Professional installation and work', 60, yPosition);
        doc.text(`£${labourTotal.toLocaleString()}`, pageWidth - 30, yPosition);
        yPosition += 8;
      }

      // Total line
      doc.setLineWidth(0.5);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Estimate:', 12, yPosition);
      doc.setTextColor(...primaryColor);
      doc.text(`£${(materialsTotal + labourTotal).toFixed(2)}`, pageWidth - 30, yPosition);
    }

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('This is an estimate only. Final costs may vary.', 10, pageHeight - 20);
    doc.text('Generated by AskToddy Mobile', 10, pageHeight - 15);
    doc.text(`Document ID: ${request.documentId || 'N/A'}`, 10, pageHeight - 10);
  }

  private static generateTimelinePDF(doc: any, request: DocumentRequest): void {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Colors
    const primaryColor = [255, 87, 34];
    const textColor = [33, 33, 33];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AskToddy', 10, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Project Timeline', pageWidth - 50, 20);

    yPosition = 45;

    // Project Details
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(request.projectType || 'Construction Timeline', 10, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const timeline = request.analysis?.timeline || request.timeline || {};
    doc.text(`Total Duration: ${timeline.totalDuration || 'TBD'}`, 10, yPosition);
    yPosition += 5;
    doc.text(`Start Date: ${timeline.startDate || 'TBD'}`, 10, yPosition);
    yPosition += 5;
    doc.text(`Completion: ${timeline.endDate || 'TBD'}`, 10, yPosition);
    yPosition += 15;

    // Timeline phases
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Phases', 10, yPosition);
    yPosition += 10;

    // Add timeline phases
    const phases = timeline.phases || [];
    doc.setFontSize(10);

    phases.forEach((phase: any, index: number) => {
      // Phase header
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(...primaryColor);
      doc.circle(12, yPosition - 2, 2, 'F');
      doc.text(`Phase ${index + 1}: ${phase.name || 'Phase'}`, 18, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`${phase.duration || 'TBD'} days`, pageWidth - 40, yPosition);
      yPosition += 6;

      // Phase description
      if (phase.description) {
        doc.setTextColor(100, 100, 100);
        const lines = doc.splitTextToSize(phase.description, pageWidth - 40);
        lines.forEach((line: string) => {
          doc.text(line, 18, yPosition);
          yPosition += 5;
        });
      }

      doc.setTextColor(...textColor);
      yPosition += 5;

      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Timeline is estimated and subject to change', 10, pageHeight - 20);
    doc.text('Generated by AskToddy Mobile', 10, pageHeight - 15);
  }

  private static generateTaskListPDF(doc: any, request: DocumentRequest): void {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Colors
    const primaryColor = [255, 87, 34];
    const textColor = [33, 33, 33];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AskToddy', 10, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Task Checklist', pageWidth - 50, 20);

    yPosition = 45;

    // Project Details
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(request.projectType || 'Project Tasks', 10, yPosition);
    yPosition += 15;

    // Tasks - gather from timeline phases or use direct tasks
    let tasks = request.tasks || [];

    // If no direct tasks, extract from timeline phases
    if (tasks.length === 0 && request.analysis?.timeline?.phases) {
      tasks = request.analysis.timeline.phases.flatMap(
        (phase: any) => phase.tasks || [{ name: phase.name, description: phase.description }]
      );
    }

    doc.setFontSize(10);

    tasks.forEach((task: any) => {
      // Checkbox
      doc.setLineWidth(0.5);
      doc.rect(10, yPosition - 4, 4, 4);

      // Task text
      doc.setFont('helvetica', task.priority === 'high' ? 'bold' : 'normal');
      const taskText = `${task.name || 'Task'}${task.priority === 'high' ? ' (Priority)' : ''}`;
      doc.text(taskText, 18, yPosition);
      yPosition += 6;

      // Task description
      if (task.description) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const lines = doc.splitTextToSize(task.description, pageWidth - 25);
        lines.forEach((line: string) => {
          doc.text(line, 18, yPosition);
          yPosition += 5;
        });
        doc.setTextColor(...textColor);
      }

      yPosition += 3;

      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
    });

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Check off tasks as you complete them', 10, pageHeight - 20);
    doc.text('Generated by AskToddy Mobile', 10, pageHeight - 15);
  }

  private static async countPages(pdfBuffer: Uint8Array): Promise<number> {
    // For jsPDF, we can track this during generation
    // For now, return 1 as default
    return 1;
  }
}
