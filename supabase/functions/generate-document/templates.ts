import type { ProjectAnalysis, CostBreakdown, Timeline, DocumentRequest } from './types.ts';

export const generateQuoteHTML = (request: DocumentRequest): string => {
  const { analysis, pricing, userDetails } = request;
  const currentDate = new Date().toLocaleDateString('en-GB');
  const quoteNumber = `Q${Date.now()}`;

  const vatRate = 0.2; // 20% VAT
  const subtotal = analysis.costBreakdown.total;
  const vatAmount = subtotal * vatRate;
  const grandTotal = subtotal + vatAmount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.4; 
          color: #2C3E50;
          background: white;
        }
        .header { 
          background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
          margin-bottom: 30px;
        }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .tagline { font-size: 14px; opacity: 0.9; }
        .content { padding: 0 30px; }
        .quote-details { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        .section { margin-bottom: 30px; }
        .section-title { 
          font-size: 18px; 
          font-weight: bold; 
          color: #FF6B35; 
          margin-bottom: 15px;
          border-bottom: 2px solid #FF6B35;
          padding-bottom: 5px;
        }
        .cost-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px;
        }
        .cost-table th, .cost-table td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #ddd; 
        }
        .cost-table th { 
          background: #f8f9fa; 
          font-weight: bold;
          color: #2C3E50;
        }
        .cost-table .category-header {
          background: #FF6B35;
          color: white;
          font-weight: bold;
        }
        .total-row { 
          background: #f0f0f0; 
          font-weight: bold; 
        }
        .grand-total { 
          background: #FF6B35; 
          color: white; 
          font-size: 16px;
        }
        .recommendations { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px;
          border-left: 4px solid #FF6B35;
        }
        .recommendations ul { margin-left: 20px; }
        .recommendations li { margin-bottom: 8px; }
        .footer { 
          margin-top: 40px; 
          padding: 20px; 
          background: #2C3E50; 
          color: white;
          text-align: center;
          border-radius: 8px;
        }
        .confidence { 
          display: inline-block;
          background: ${analysis.confidence >= 80 ? '#28a745' : analysis.confidence >= 60 ? '#ffc107' : '#dc3545'};
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          margin-left: 10px;
        }
        @media print {
          .header { break-inside: avoid; }
          .section { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏗️ AskToddy</div>
        <div class="tagline">AI-Powered Construction Quoting</div>
      </div>

      <div class="content">
        <div class="quote-details">
          <div>
            <h3>Quote Details</h3>
            <p><strong>Quote Number:</strong> ${quoteNumber}</p>
            <p><strong>Date:</strong> ${currentDate}</p>
            <p><strong>Project Type:</strong> ${analysis.projectType}</p>
            <p><strong>AI Confidence:</strong> ${analysis.confidence}%<span class="confidence">${analysis.confidence >= 80 ? 'High' : analysis.confidence >= 60 ? 'Medium' : 'Low'}</span></p>
          </div>
          ${
            userDetails
              ? `
          <div>
            <h3>Customer Details</h3>
            ${userDetails.name ? `<p><strong>Name:</strong> ${userDetails.name}</p>` : ''}
            ${userDetails.email ? `<p><strong>Email:</strong> ${userDetails.email}</p>` : ''}
            ${userDetails.phone ? `<p><strong>Phone:</strong> ${userDetails.phone}</p>` : ''}
            ${userDetails.address ? `<p><strong>Address:</strong> ${userDetails.address}</p>` : ''}
          </div>
          `
              : ''
          }
        </div>

        <div class="section">
          <h2 class="section-title">Project Description</h2>
          <p>${analysis.description}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Cost Breakdown</h2>
          <table class="cost-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${
                analysis.costBreakdown.materials.length > 0
                  ? `
                <tr class="category-header">
                  <td colspan="6">Materials</td>
                </tr>
                ${analysis.costBreakdown.materials
                  .map(
                    item => `
                  <tr>
                    <td>${item.item}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>£${item.unitPrice.toFixed(2)}</td>
                    <td>£${item.total.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
              `
                  : ''
              }
              
              ${
                analysis.costBreakdown.labour.length > 0
                  ? `
                <tr class="category-header">
                  <td colspan="6">Labour</td>
                </tr>
                ${analysis.costBreakdown.labour
                  .map(
                    item => `
                  <tr>
                    <td>${item.item}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>£${item.unitPrice.toFixed(2)}</td>
                    <td>£${item.total.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
              `
                  : ''
              }
              
              ${
                analysis.costBreakdown.tools.length > 0
                  ? `
                <tr class="category-header">
                  <td colspan="6">Tools & Equipment</td>
                </tr>
                ${analysis.costBreakdown.tools
                  .map(
                    item => `
                  <tr>
                    <td>${item.item}</td>
                    <td>${item.description || '-'}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>£${item.unitPrice.toFixed(2)}</td>
                    <td>£${item.total.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join('')}
              `
                  : ''
              }
              
              <tr class="total-row">
                <td colspan="5"><strong>Subtotal</strong></td>
                <td><strong>£${subtotal.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td colspan="5">VAT (${(vatRate * 100).toFixed(0)}%)</td>
                <td>£${vatAmount.toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td colspan="5"><strong>TOTAL</strong></td>
                <td><strong>£${grandTotal.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2 class="section-title">Timeline</h2>
          <p><strong>Estimated Duration:</strong> ${analysis.timeline.totalDuration}</p>
          ${analysis.timeline.phases
            .map(
              phase => `
            <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
              <h4 style="color: #FF6B35; margin-bottom: 8px;">${phase.name}</h4>
              <p><strong>Duration:</strong> ${phase.duration}</p>
              ${phase.description ? `<p>${phase.description}</p>` : ''}
            </div>
          `
            )
            .join('')}
        </div>

        ${
          analysis.recommendations.length > 0
            ? `
        <div class="section">
          <h2 class="section-title">Recommendations</h2>
          <div class="recommendations">
            <ul>
              ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
        </div>
        `
            : ''
        }

        <div class="footer">
          <p><strong>Generated by AskToddy AI</strong> • Powered by ${analysis.aiProvider}</p>
          <p>This quote is valid for 30 days • All prices include VAT</p>
          <p>Contact: hello@asktoddy.com • www.asktoddy.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateTimelineHTML = (request: DocumentRequest): string => {
  const { analysis } = request;
  const currentDate = new Date().toLocaleDateString('en-GB');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #2C3E50;
          background: white;
        }
        .header { 
          background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
          margin-bottom: 30px;
        }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .content { padding: 0 30px; }
        .project-info { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin-bottom: 30px;
        }
        .timeline { margin-bottom: 30px; }
        .phase { 
          margin-bottom: 25px; 
          padding: 20px; 
          border-left: 4px solid #FF6B35;
          background: #fafafa;
          border-radius: 0 8px 8px 0;
        }
        .phase-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          margin-bottom: 15px;
        }
        .phase-title { 
          font-size: 18px; 
          font-weight: bold; 
          color: #FF6B35; 
        }
        .phase-duration { 
          background: #FF6B35; 
          color: white; 
          padding: 5px 15px; 
          border-radius: 20px;
          font-size: 14px;
        }
        .tasks { margin-top: 15px; }
        .task { 
          margin-bottom: 15px; 
          padding: 15px; 
          background: white; 
          border-radius: 5px;
          border: 1px solid #e9ecef;
        }
        .task-title { font-weight: bold; margin-bottom: 8px; }
        .task-details { color: #666; font-size: 14px; }
        .skills, .tools { margin-top: 8px; }
        .tag { 
          display: inline-block; 
          background: #e9ecef; 
          padding: 2px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
          margin: 2px;
        }
        .section-title { 
          font-size: 20px; 
          font-weight: bold; 
          color: #2C3E50; 
          margin-bottom: 20px;
          border-bottom: 2px solid #FF6B35;
          padding-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏗️ AskToddy</div>
        <div>Project Timeline & Schedule</div>
      </div>

      <div class="content">
        <div class="project-info">
          <h2>${analysis.projectType} - Project Timeline</h2>
          <p><strong>Generated:</strong> ${currentDate}</p>
          <p><strong>Total Duration:</strong> ${analysis.timeline.totalDuration}</p>
          <p><strong>Description:</strong> ${analysis.description}</p>
        </div>

        <h2 class="section-title">Project Phases</h2>
        <div class="timeline">
          ${analysis.timeline.phases
            .map(
              (phase, index) => `
            <div class="phase">
              <div class="phase-header">
                <div class="phase-title">Phase ${index + 1}: ${phase.name}</div>
                <div class="phase-duration">${phase.duration}</div>
              </div>
              ${phase.description ? `<p style="margin-bottom: 15px;">${phase.description}</p>` : ''}
              ${
                phase.dependencies && phase.dependencies.length > 0
                  ? `
                <p><strong>Dependencies:</strong> ${phase.dependencies.join(', ')}</p>
              `
                  : ''
              }
              
              ${
                phase.tasks && phase.tasks.length > 0
                  ? `
                <div class="tasks">
                  <h4 style="margin-bottom: 10px;">Tasks:</h4>
                  ${phase.tasks
                    .map(
                      task => `
                    <div class="task">
                      <div class="task-title">${task.name}</div>
                      <div class="task-details">
                        <p><strong>Duration:</strong> ${task.duration}</p>
                        ${task.description ? `<p>${task.description}</p>` : ''}
                        ${
                          task.skillsRequired.length > 0
                            ? `
                          <div class="skills">
                            <strong>Skills Required:</strong>
                            ${task.skillsRequired.map(skill => `<span class="tag">${skill}</span>`).join('')}
                          </div>
                        `
                            : ''
                        }
                        ${
                          task.toolsNeeded.length > 0
                            ? `
                          <div class="tools">
                            <strong>Tools Needed:</strong>
                            ${task.toolsNeeded.map(tool => `<span class="tag">${tool}</span>`).join('')}
                          </div>
                        `
                            : ''
                        }
                        ${
                          task.safetyConsiderations && task.safetyConsiderations.length > 0
                            ? `
                          <div style="margin-top: 8px; padding: 8px; background: #fff3cd; border-radius: 4px;">
                            <strong>⚠️ Safety:</strong> ${task.safetyConsiderations.join(', ')}
                          </div>
                        `
                            : ''
                        }
                      </div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>

        <div style="margin-top: 40px; padding: 20px; background: #2C3E50; color: white; text-align: center; border-radius: 8px;">
          <p><strong>Generated by AskToddy AI</strong></p>
          <p>This timeline is an estimate based on AI analysis • Actual durations may vary</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateTaskListHTML = (request: DocumentRequest): string => {
  const { analysis } = request;
  const currentDate = new Date().toLocaleDateString('en-GB');

  // Collect all tasks from all phases
  const allTasks = analysis.timeline.phases.flatMap(phase => phase.tasks || []);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #2C3E50;
          background: white;
        }
        .header { 
          background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
          color: white; 
          padding: 30px; 
          text-align: center;
          margin-bottom: 30px;
        }
        .logo { font-size: 32px; font-weight: bold; margin-bottom: 8px; }
        .content { padding: 0 30px; }
        .project-info { 
          background: #f8f9fa; 
          padding: 20px; 
          border-radius: 8px; 
          margin-bottom: 30px;
        }
        .task-category { margin-bottom: 30px; }
        .category-title { 
          font-size: 18px; 
          font-weight: bold; 
          color: #FF6B35; 
          margin-bottom: 15px;
          padding: 10px 15px;
          background: #fff5f2;
          border-radius: 5px;
          border-left: 4px solid #FF6B35;
        }
        .task-item { 
          margin-bottom: 15px; 
          padding: 15px; 
          background: #fafafa; 
          border-radius: 5px;
          border: 1px solid #e9ecef;
        }
        .task-header { 
          display: flex; 
          align-items: center; 
          margin-bottom: 10px;
        }
        .checkbox { 
          width: 20px; 
          height: 20px; 
          border: 2px solid #FF6B35; 
          border-radius: 3px; 
          margin-right: 15px;
          background: white;
        }
        .task-title { font-weight: bold; flex: 1; }
        .task-duration { 
          background: #FF6B35; 
          color: white; 
          padding: 3px 10px; 
          border-radius: 15px;
          font-size: 12px;
        }
        .task-details { margin-left: 35px; color: #666; }
        .tag { 
          display: inline-block; 
          background: #e9ecef; 
          padding: 2px 8px; 
          border-radius: 12px; 
          font-size: 12px; 
          margin: 2px;
        }
        .safety-tag { background: #fff3cd; }
        .section-title { 
          font-size: 20px; 
          font-weight: bold; 
          color: #2C3E50; 
          margin-bottom: 20px;
          border-bottom: 2px solid #FF6B35;
          padding-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">🏗️ AskToddy</div>
        <div>Project Task List</div>
      </div>

      <div class="content">
        <div class="project-info">
          <h2>${analysis.projectType} - Task Checklist</h2>
          <p><strong>Generated:</strong> ${currentDate}</p>
          <p><strong>Total Tasks:</strong> ${allTasks.length}</p>
          <p><strong>Description:</strong> ${analysis.description}</p>
        </div>

        <h2 class="section-title">Project Tasks by Phase</h2>
        
        ${analysis.timeline.phases
          .map(
            (phase, phaseIndex) => `
          <div class="task-category">
            <div class="category-title">
              Phase ${phaseIndex + 1}: ${phase.name} (${phase.duration})
            </div>
            
            ${
              phase.tasks && phase.tasks.length > 0
                ? phase.tasks
                    .map(
                      (task, taskIndex) => `
                <div class="task-item">
                  <div class="task-header">
                    <div class="checkbox"></div>
                    <div class="task-title">${task.name}</div>
                    <div class="task-duration">${task.duration}</div>
                  </div>
                  <div class="task-details">
                    ${task.description ? `<p style="margin-bottom: 8px;">${task.description}</p>` : ''}
                    
                    ${
                      task.skillsRequired.length > 0
                        ? `
                      <div style="margin-bottom: 8px;">
                        <strong>Skills Required:</strong>
                        ${task.skillsRequired.map(skill => `<span class="tag">${skill}</span>`).join('')}
                      </div>
                    `
                        : ''
                    }
                    
                    ${
                      task.toolsNeeded.length > 0
                        ? `
                      <div style="margin-bottom: 8px;">
                        <strong>Tools Needed:</strong>
                        ${task.toolsNeeded.map(tool => `<span class="tag">${tool}</span>`).join('')}
                      </div>
                    `
                        : ''
                    }
                    
                    ${
                      task.safetyConsiderations && task.safetyConsiderations.length > 0
                        ? `
                      <div>
                        <strong>⚠️ Safety Considerations:</strong>
                        ${task.safetyConsiderations.map(safety => `<span class="tag safety-tag">${safety}</span>`).join('')}
                      </div>
                    `
                        : ''
                    }
                  </div>
                </div>
              `
                    )
                    .join('')
                : '<p style="color: #666; font-style: italic; margin-left: 15px;">No specific tasks defined for this phase</p>'
            }
          </div>
        `
          )
          .join('')}

        <div style="margin-top: 30px; padding: 20px; background: #e7f5ff; border-radius: 8px; border-left: 4px solid #0066cc;">
          <h3 style="color: #0066cc; margin-bottom: 10px;">💡 Usage Instructions</h3>
          <ul style="margin-left: 20px; color: #555;">
            <li>Print this checklist and check off tasks as you complete them</li>
            <li>Follow the phase order for optimal workflow</li>
            <li>Ensure all safety considerations are addressed before starting each task</li>
            <li>Have all required tools and materials ready before beginning</li>
          </ul>
        </div>

        <div style="margin-top: 40px; padding: 20px; background: #2C3E50; color: white; text-align: center; border-radius: 8px;">
          <p><strong>Generated by AskToddy AI</strong></p>
          <p>This task list is generated based on AI analysis • Always follow local building codes and safety regulations</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
