import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const extractVariant = (name) => {
  if (!name) return "";
  const start = name.indexOf("(");
  const end = name.lastIndexOf(")");
  if (start !== -1 && end !== -1 && end > start) {
    return name.slice(start + 1, end).trim();
  }
  return "";
};

const cleanProductName = (name) => {
  if (!name) return "Product";
  const idx = name.indexOf("(");
  return idx !== -1 ? name.slice(0, idx).trim() : name;
};

const formatPaymentMethod = (method) => {
  if (!method) return "COD";
  const m = String(method).toLowerCase();
  if (m === "cod") return "Cash on Delivery (COD)";
  if (m === "partial_cod") return "Partial COD";
  if (m === "prepaid") return "Online Prepaid";
  return method.toUpperCase();
};

export const generateInvoicePDF = (orderOrState) => {
  const isState = !!orderOrState.cartItems;
  
  const orderId = orderOrState.referenceSlug || orderOrState.orderNumber || orderOrState.orderId || orderOrState.id || "KG000000";
  const date = orderOrState.createdAt 
    ? new Date(orderOrState.createdAt).toLocaleDateString("en-IN") 
    : new Date().toLocaleDateString("en-IN");
  
  const paymentMethod = orderOrState.paymentMethod || orderOrState.paymentType || "COD";
  
  let shippingAddr = {};
  if (isState) {
    shippingAddr = orderOrState.selectedShippingAddr || orderOrState.selectedAddr || {};
  } else {
    shippingAddr = orderOrState.shippingAddress || {};
  }
  
  let items = [];
  if (isState) {
    items = (orderOrState.cartItems || []).map(item => {
      const rawName = item.name || item.productName || "Product";
      const cleaned = cleanProductName(rawName);
      let variantName = item.selectedVariantName || "";
      if (!variantName && item.selectedVariant) {
        variantName = item.selectedVariant;
      }
      if (!variantName) {
        variantName = extractVariant(rawName);
      }
      return {
        name: cleaned,
        quantity: item.quantity || 1,
        price: parseFloat(item.price || 0),
        total: parseFloat(item.price || 0) * (item.quantity || 1),
        variant: variantName
      };
    });
  } else {
    items = (orderOrState.items || []).map(item => {
      const rawName = item.productName || "Product";
      const cleaned = cleanProductName(rawName);
      let variantName = item.selectedVariantName || "";
      if (!variantName && item.selectedVariant) {
        variantName = item.selectedVariant;
      }
      if (!variantName) {
        variantName = extractVariant(rawName);
      }
      return {
        name: cleaned,
        quantity: item.quantity || 1,
        price: parseFloat(item.price || item.salesPrice || 0),
        total: parseFloat(item.price || item.salesPrice || 0) * (item.quantity || 1),
        variant: variantName
      };
    });
  }
  
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = parseFloat(orderOrState.couponDiscount || orderOrState.discountAmount || orderOrState.discount || 0);
  const shipping = parseFloat(orderOrState.shippingCharge || (orderOrState.partialCod?.shippingCharge) || 0);
  const tax = parseFloat(orderOrState.tax || orderOrState.taxAmount || 0);
  const grandTotal = subtotal - discount + shipping;
  
  const doc = new jsPDF();

  const status = (orderOrState.status || "").toLowerCase();
  if (status === "cancelled") {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(60);
    doc.setTextColor(254, 226, 226); // very light grey-red (#fee2e2)
    doc.text("CANCELLED", 105, 140, { align: "center", angle: 45 });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38); // red-600
    doc.text("ORDER CANCELLED", 105, 12, { align: "center" });
  }

  // Header styling - Clean, minimal store info aligned left X=20
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(182, 4, 16); // Brand red color: #b60410
  doc.text("JB HOUSE OF FASHION", 20, 25);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("Premium Apparel & Tailoring", 20, 31);
  doc.text("Email: jbbeautyandfashion@gmail.com | Phone: +91 95008 48860", 20, 37);
  doc.text("Web: www.jbhouseoffashion.com", 20, 43);
  
  // Invoice details - Right aligned X=190
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(17);
  doc.text("TAX INVOICE", 190, 25, { align: "right" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice No: #INV-${orderId}`, 190, 31, { align: "right" });
  doc.text(`Order Date: ${date}`, 190, 37, { align: "right" });
  doc.text(`Payment: ${formatPaymentMethod(paymentMethod)}`, 190, 43, { align: "right" });
  
  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 48, 190, 48);
  
  // Deliver To Card (matching user image styling)
  doc.setFillColor(252, 253, 254);
  doc.rect(20, 53, 170, 34, "F");
  doc.setDrawColor(235, 237, 240);
  doc.setLineWidth(0.5);
  doc.rect(20, 53, 170, 34, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("DELIVER TO:", 24, 60);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17);
  doc.text(shippingAddr.fullName || shippingAddr.name || "Customer", 24, 66);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text(shippingAddr.street || shippingAddr.addressLine1 || "", 24, 72);
  doc.text(`${shippingAddr.city || ""}, ${shippingAddr.state || ""} - ${shippingAddr.pincode || ""}`, 24, 78);
  doc.text(`Phone: ${shippingAddr.phone || ""}`, 24, 83);
  
  // Table rows: Set descriptive text so autotable computes height correctly
  const tableRows = items.map((item, idx) => [
    idx + 1,
    item.name + (item.variant ? `\n${item.variant}` : ""),
    item.quantity,
    `Rs. ${item.price.toFixed(2)}`,
    `Rs. ${item.total.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    startY: 93,
    margin: { left: 20, right: 20 },
    head: [[
      { content: "#", styles: { halign: "center" } },
      { content: "Item Description", styles: { halign: "left" } },
      { content: "Qty", styles: { halign: "center" } },
      { content: "Unit Price", styles: { halign: "right" } },
      { content: "Total Amount", styles: { halign: "right" } }
    ]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [182, 4, 16], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
    styles: { font: "helvetica", fontSize: 8, valign: "middle" },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" }
    },
    didParseCell: function(data) {
      if (data.section === 'head') {
        if (data.column.index === 3 || data.column.index === 4) {
          data.cell.styles.halign = 'right';
        }
        if (data.column.index === 2) {
          data.cell.styles.halign = 'center';
        }
        if (data.column.index === 0) {
          data.cell.styles.halign = 'center';
        }
      }
    },
    willDrawCell: function(data) {
      // Clear autotable text in column 1 so we can draw custom styled content
      if (data.column.index === 1 && data.cell.section === 'body') {
        data.cell.text = '';
      }
    },
    didDrawCell: function(data) {
      // Draw product name in bold and variant details in small grey font
      if (data.column.index === 1 && data.cell.section === 'body') {
        const rawItem = items[data.row.index];
        const docObj = data.doc;
        const x = data.cell.x + data.cell.padding('left');
        const y = data.cell.y + data.cell.padding('top') + 3.5;
        
        docObj.setFont("helvetica", "bold");
        docObj.setFontSize(8.5);
        docObj.setTextColor(17);
        docObj.text(rawItem.name, x, y);
        
        if (rawItem.variant) {
          docObj.setFont("helvetica", "normal");
          docObj.setFontSize(7.5);
          docObj.setTextColor(120);
          docObj.text(rawItem.variant, x, y + 4.5);
        }
      }
    }
  });
  
  const finalY = doc.lastAutoTable.finalY + 12;
  
  // Totals calculations aligned right side (X=120 to X=190)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  
  doc.text("Subtotal:", 120, finalY);
  doc.text(`Rs. ${subtotal.toFixed(2)}`, 190, finalY, { align: "right" });
  
  let currentY = finalY + 6;
  if (discount > 0) {
    doc.text("Discount:", 120, currentY);
    doc.text(`- Rs. ${discount.toFixed(2)}`, 190, currentY, { align: "right" });
    currentY += 6;
  }
  
  doc.text("Shipping:", 120, currentY);
  doc.text(`Rs. ${shipping.toFixed(2)}`, 190, currentY, { align: "right" });
  currentY += 6;
  
  if (tax > 0) {
    doc.text("GST/Tax:", 120, currentY);
    doc.text(`Rs. ${tax.toFixed(2)}`, 190, currentY, { align: "right" });
    currentY += 6;
  }
  
  // Divider inside totals block (thin line)
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.3);
  doc.line(120, currentY - 2, 190, currentY - 2);
  
  // Grand Total details - Bold and Brand Red
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(182, 4, 16); // Brand red
  doc.text("Grand Total:", 120, currentY + 3);
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, 190, currentY + 3, { align: "right" });
  
  // Thick red double underline or thick red bar under Grand Total (as seen in image)
  doc.setDrawColor(182, 4, 16);
  doc.setLineWidth(1.5);
  doc.line(120, currentY + 6, 190, currentY + 6);
  
  currentY += 15;

  // COD Due Details (if partial COD)
  if (paymentMethod === "partial_cod" && orderOrState.partialCod) {
    const codDetail = orderOrState.partialCod;
    
    doc.setFillColor(255, 248, 225); // amber light
    doc.rect(120, currentY - 4, 70, 16, "F");
    doc.setDrawColor(255, 224, 130);
    doc.setLineWidth(0.3);
    doc.rect(120, currentY - 4, 70, 16, "D");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 60, 0);
    doc.text(`Advance Paid: Rs. ${parseFloat(codDetail.deliveryChargePaid || 0).toFixed(2)}`, 124, currentY + 1);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(120, 60, 0);
    doc.text(`COD Due on Delivery: Rs. ${parseFloat(codDetail.amountDueOnDelivery || 0).toFixed(2)}`, 124, currentY + 7);
    
    currentY += 18;
  }
  
  // Terms & Footer
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(50);
  doc.text("TERMS & CONDITIONS:", 20, currentY + 10);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text("1. This is a computer-generated invoice and requires no signature.", 20, currentY + 15);
  doc.text("2. Returns/Replacements can be requested from the 'My Orders' tab within 7 days.", 20, currentY + 20);
  
  // Thank you centered at bottom
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(182, 4, 16);
  doc.text("Thank you for shopping with JB House of Fashion!", 105, currentY + 35, { align: "center" });
  
  doc.save(`Invoice_${orderId}.pdf`);
};
