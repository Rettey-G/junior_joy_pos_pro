  // Open bill in a new window
  const openBillInNewWindow = () => {
    if (!completedSale) return;
    
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (!newWindow) {
      alert('Please allow popups for this site to view the bill in a new window.');
      return;
    }
    
    // Create bill content
    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill #${completedSale.billNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .bill-container { max-width: 800px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1); }
          .bill-header { text-align: center; margin-bottom: 30px; }
          .bill-header h2 { color: #1976d2; margin: 0; font-size: 24px; }
          .bill-header p { margin: 5px 0; color: #757575; }
          .bill-logo { width: 100px; height: 100px; object-fit: cover; border-radius: 50%; margin-bottom: 15px; }
          .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .bill-info-item { margin-bottom: 15px; }
          .bill-info-label { font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
          th { background-color: #f5f7fa; font-weight: 600; }
          .totals { width: 300px; margin-left: auto; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .grand-total { font-weight: bold; font-size: 18px; border-top: 1px solid #e0e0e0; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 30px; }
          .actions { text-align: center; margin-top: 30px; }
          .btn { padding: 10px 20px; margin: 0 5px; cursor: pointer; border-radius: 4px; font-weight: 500; transition: all 0.2s; }
          .btn-primary { background-color: #1976d2; color: white; border: none; }
          .btn-primary:hover { background-color: #1565c0; }
          .btn-success { background-color: #4caf50; color: white; border: none; }
          .btn-success:hover { background-color: #388e3c; }
          @media print { .actions { display: none; } }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="bill-header">
            <img src="/juniorjoy.jpg" alt="Junior Joy Logo" class="bill-logo" onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMxOTc2ZDIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+Skg8L3RleHQ+PC9zdmc+'" />
            <h2>Junior Joy POS</h2>
            <p>Professional Point of Sale System</p>
            <h3>BILL</h3>
            <p>Bill No: ${completedSale.billNumber}</p>
            <p>Date: ${new Date(completedSale.createdAt || Date.now()).toLocaleString()}</p>
          </div>
          
          <div class="bill-info">
            <div class="bill-info-item">
              <div class="bill-info-label">Customer:</div>
              <div>${safeRender(completedSale.customer)}</div>
              ${completedSale.customerPhone ? `<div>Phone: ${safeRender(completedSale.customerPhone)}</div>` : ''}
            </div>
            <div class="bill-info-item">
              <div class="bill-info-label">Cashier:</div>
              <div>${safeRender(completedSale.cashier)}</div>
            </div>
          </div>
          
          <div class="bill-info-item">
            <div class="bill-info-label">Payment Method:</div>
            <div>${safeRender(completedSale.paymentMethod || 'Cash')}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${completedSale.products.map(item => `
                <tr>
                  <td>${safeRender(item.name)}</td>
                  <td>${item.quantity}</td>
                  <td>MVR ${Number(item.price).toFixed(2)}</td>
                  <td>MVR ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span> <span>MVR ${completedSale.subtotal.toFixed(2)}</span></div>
            <div class="total-row"><span>GST (16%):</span> <span>MVR ${completedSale.gst.toFixed(2)}</span></div>
            <div class="total-row"><span>Service Charge (10%):</span> <span>MVR ${completedSale.serviceCharge.toFixed(2)}</span></div>
            <div class="total-row"><span>Discount:</span> <span>- MVR ${completedSale.discount.toFixed(2)}</span></div>
            <div class="total-row grand-total"><span>Total:</span> <span>MVR ${completedSale.total.toFixed(2)}</span></div>
            <div class="total-row"><span>Paid:</span> <span>MVR ${completedSale.amountPaid.toFixed(2)}</span></div>
            <div class="total-row"><span>Change:</span> <span>MVR ${completedSale.change.toFixed(2)}</span></div>
          </div>
          
          ${completedSale.notes ? `
            <div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
              <div style="font-weight: bold; margin-bottom: 5px;">Notes:</div>
              <div>${safeRender(completedSale.notes)}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            <p><strong>Thank you for your business!</strong></p>
            <p>Please keep this invoice for your records.</p>
          </div>
          
          <div class="actions">
            <button class="btn btn-primary" onclick="window.print()">Print Bill</button>
            <button class="btn btn-success" onclick="window.close()">Close</button>
          </div>
        </div>
        <script>
          // Auto-print when the window opens
          window.onload = function() {
            // Uncomment the line below to automatically print when the window opens
            // window.print();
          };
        </script>
      </body>
      </html>
    `;
    
    newWindow.document.open();
    newWindow.document.write(billContent);
    newWindow.document.close();
  };

  const printBill = () => {
    // Add a class to the body for print-specific styling
    document.body.classList.add('printing-bill');
    
    // Print the document
    window.print();
    
    // Remove the class after printing
    setTimeout(() => {
      document.body.classList.remove('printing-bill');
    }, 500);
  };

  const generatePDF = () => {
    if (!completedSale) {
      setError('No sale data available');
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      // Add business logo and info
      try {
        // Add logo image
        const imgData = '/juniorjoy.jpg';
        doc.addImage(imgData, 'JPEG', 85, 10, 40, 20);
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
        // Fallback to text if image fails
        doc.setFontSize(20);
        doc.setTextColor(25, 118, 210); // #1976d2
        doc.text('Junior Joy POS', 105, 20, { align: 'center' });
      }
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Professional Point of Sale System', 105, 35, { align: 'center' });
      
      // Add bill details
      doc.setFontSize(14);
      doc.text('BILL', 105, 45, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Bill No: ${completedSale.billNumber}`, 20, 60);
      doc.text(`Date: ${new Date(completedSale.createdAt || Date.now()).toLocaleString()}`, 20, 65);
      doc.text(`Customer: ${safeRender(completedSale.customer)}`, 20, 70);
      if (completedSale.customerPhone) {
        doc.text(`Phone: ${safeRender(completedSale.customerPhone)}`, 20, 75);
      }
      doc.text(`Cashier: ${safeRender(completedSale.cashier)}`, 20, completedSale.customerPhone ? 80 : 75);
      doc.text(`Payment Method: ${safeRender(completedSale.paymentMethod || 'Cash')}`, 20, completedSale.customerPhone ? 85 : 80);
      
      // Add products table
      const tableColumn = ["Item", "Qty", "Price", "Total"];
      const tableRows = [];
      
      completedSale.products.forEach(item => {
        const itemData = [
          safeRender(item.name),
          item.quantity,
          `MVR ${Number(item.price).toFixed(2)}`,
          `MVR ${(Number(item.price) * Number(item.quantity)).toFixed(2)}`
        ];
        tableRows.push(itemData);
      });
      
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: completedSale.customerPhone ? 95 : 90,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [25, 118, 210] }
      });
      
      // Add totals
      const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 75) + 10;
      
      doc.text(`Subtotal:`, 130, finalY);
      doc.text(`MVR ${completedSale.subtotal.toFixed(2)}`, 170, finalY, { align: 'right' });
      
      doc.text(`GST (16%):`, 130, finalY + 5);
      doc.text(`MVR ${completedSale.gst.toFixed(2)}`, 170, finalY + 5, { align: 'right' });
      
      doc.text(`Service Charge (10%):`, 130, finalY + 10);
      doc.text(`MVR ${completedSale.serviceCharge.toFixed(2)}`, 170, finalY + 10, { align: 'right' });
      
      doc.text(`Discount:`, 130, finalY + 15);
      doc.text(`MVR ${completedSale.discount.toFixed(2)}`, 170, finalY + 15, { align: 'right' });
      
      doc.setFontSize(12);
      doc.text(`Total:`, 130, finalY + 22);
      doc.text(`MVR ${completedSale.total.toFixed(2)}`, 170, finalY + 22, { align: 'right' });
      
      doc.setFontSize(10);
      doc.text(`Amount Paid:`, 130, finalY + 30);
      doc.text(`MVR ${completedSale.amountPaid.toFixed(2)}`, 170, finalY + 30, { align: 'right' });
      
      doc.text(`Change:`, 130, finalY + 35);
      doc.text(`MVR ${completedSale.change.toFixed(2)}`, 170, finalY + 35, { align: 'right' });
      
      // Add notes if available
      if (completedSale.notes) {
        doc.text('Notes:', 20, finalY + 45);
        doc.text(completedSale.notes, 20, finalY + 50);
      }
      
      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for your business!', 105, finalY + (completedSale.notes ? 65 : 50), { align: 'center' });
      doc.setFontSize(8);
      doc.text('Please keep this invoice for your records.', 105, finalY + (completedSale.notes ? 70 : 55), { align: 'center' });
      
      // Save the PDF with a proper filename
      doc.save(`Bill-${completedSale.billNumber}-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    }
  };
