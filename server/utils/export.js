const puppeteer = require('puppeteer');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');
const templateRenderer = require('./templateRenderer');

async function generatePDF(htmlContent, options = {}) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ]
    });

    const page = await browser.newPage();
    
    // Set a timeout for the entire page operation
    page.setDefaultNavigationTimeout(30000); 

    const logoPath = path.join(__dirname, '../../Assets/logo.png');
    let logoDataUri = '';
    try {
      if (fs.existsSync(logoPath)) {
        const logoBase64 = fs.readFileSync(logoPath).toString('base64');
        logoDataUri = `data:image/png;base64,${logoBase64}`;
      }
    } catch (e) {
      console.error('Error reading logo for PDF:', e);
    }

    const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;900&family=Barlow+Condensed:wght@700;900&family=Space+Mono&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Barlow', 'Segoe UI', sans-serif; 
          font-size: 13px;
          line-height: 1.6;
          color: #1a1a1a;
          background: white;
          padding: 60px 50px;
        }
        
        /* LETTERHEAD DESIGN */
        .header {
          text-align: center;
          padding-bottom: 30px;
          border-bottom: 3px solid ${options.color || '#9b7cff'};
          margin-bottom: 40px;
          position: relative;
        }
        
        .header-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 36px;
          font-weight: 900;
          color: ${options.color || '#9b7cff'};
          text-transform: uppercase;
          letter-spacing: 4px;
          margin: 0;
          line-height: 1;
        }
        
        .header .subtitle {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-top: 8px;
          padding: 4px 12px;
          background: #f8f8f8;
          border-radius: 4px;
          display: inline-block;
        }
        
        .header .doc-date {
          position: absolute;
          right: 0;
          top: 0;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #999;
        }
        
        .content { 
          margin-bottom: 50px;
          min-height: 500px;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #333;
          margin: 25px 0 12px;
          text-transform: uppercase;
          border-bottom: 1px solid #eee;
          padding-bottom: 6px;
        }
        
        .field { margin-bottom: 15px; }
        .field-label { 
          font-size: 10px; 
          font-weight: 700; 
          color: #888; 
          text-transform: uppercase; 
          letter-spacing: 1px; 
          margin-bottom: 4px; 
        }
        .field-value { 
          font-size: 14px; 
          color: #111; 
          padding: 10px 14px; 
          background: #fafafa; 
          border: 1px solid #f0f0f0;
          border-radius: 6px; 
        }
        
        .field-value.empty { color: #ccc; font-style: italic; }
        
        table { width: 100%; border-collapse: collapse; margin: 20px 0; border: 1px solid #eee; }
        table th, table td { border: 1px solid #eee; padding: 12px 15px; text-align: left; }
        table th { background: #f9f9f9; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #666; }
        
        .footer {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid #eee;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #aaa;
          margin-top: 60px;
        }
        
        .signature-block {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .signature-block .sig-box { width: 42%; }
        .signature-block .sig-line { border-bottom: 1px solid #ddd; height: 50px; margin-bottom: 8px; }
        .signature-block .sig-label { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 1px; }

        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="doc-date">DATE: ${new Date().toLocaleDateString()}</div>
        <div class="header-top">
          ${logoDataUri ? `<img src="${logoDataUri}" alt="Logo" style="height: 70px; object-fit: contain;">` : ''}
          <h1>XENOTRIX</h1>
        </div>
        <div class="subtitle">${options.type || 'Official Document'}</div>
      </div>
      <div class="content">
        ${htmlContent}
      </div>
      <div class="footer">
        Xenotrix Digital Agency · xenotrix.com · Confidential
      </div>
    </body>
    </html>
  `;

    await page.setContent(fullHTML, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    // Give it 1 second for any scripts/styles that might need a tick
    await new Promise(r => setTimeout(r, 1000));
    
    // Try to wait for fonts but don't crash if it fails
    try {
      await page.evaluateHandle('document.fonts.ready');
    } catch (e) {
      console.warn('Font loading wait failed/timed out, proceeding with PDF');
    }

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true
    });

    await browser.close();
    return pdf;
  } catch (error) {
    console.error('CRITICAL PDF ERROR:', error);
    if (browser) await browser.close();
    
    // Provide more specific error messages for missing dependencies
    if (error.message.includes('Could not find Chromium')) {
      throw new Error('PDF Engine initialization failed: browser binary missing. Please ensure puppeteer is correctly installed.');
    }
    if (error.message.includes('Protocol error') || error.message.includes('Target closed')) {
      throw new Error('PDF Engine crashed: the browser process died. This is usually due to memory limits (try reducing document complexity).');
    }
    
    throw error;
  }
}


async function generateDOCX(templateType, fields = {}, options = {}) {
  const config = templateRenderer.getTemplateConfig(templateType);
  
  const children = [];
  
  // Title
  children.push(
    new Paragraph({
      text: config.label || 'Document',
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 }
    })
  );
  
  // Date
  children.push(
    new Paragraph({
      text: `Date: ${new Date().toLocaleDateString()}`,
      spacing: { after: 400 }
    })
  );
  
  // Confidential warning for sensitive documents
  if (config.isConfidential) {
    children.push(
      new Paragraph({
        text: '⚠ CONFIDENTIAL - HANDLE WITH CARE',
        spacing: { after: 200 },
        bold: true,
        color: 'FF0000'
      })
    );
  }
  
  // Sections
  if (config.sections) {
    config.sections.forEach(section => {
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        })
      );
      
      if (section.fields) {
        section.fields.forEach(field => {
          const value = fields[field.key] || '';
          const displayValue = value || `[${field.label}]`;
          
          children.push(
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `${field.label}: `, 
                  bold: true,
                  font: 'Calibri'
                }),
                new TextRun({ 
                  text: displayValue,
                  font: 'Calibri'
                })
              ],
              spacing: { after: 100 }
            })
          );
        });
      }
    });
  }
  
  // Footer
  children.push(
    new Paragraph({
      text: `Generated by Xenotrix Agency OS - ${new Date().toLocaleDateString()}`,
      spacing: { before: 600 },
      alignment: 'center'
    })
  );
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });
  
  return await Packer.toBuffer(doc);
}

module.exports = { generatePDF, generateDOCX };
