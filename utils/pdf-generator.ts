import type { jsPDF } from "jspdf";
import logo from "../public/assets/logo.jpg";

export const generateStandardPDF = async (
  title: string,
  data: any,
  generateContent: (doc: jsPDF, formatNumber: (n: number) => string, autoTable: any) => void,
  action: 'download' | 'share' = 'download',
  onComplete: () => void = () => { },
  onError: () => void = () => { }
) => {
  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // --- 1. Dark Theme Background ---
    const drawBackground = () => {
      doc.setFillColor(0, 0, 0);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
    };

    // Apply key patches to ensure background persists on new pages
    const originalAddPage = doc.addPage;
    doc.addPage = function (...args: any[]) {
      const result = originalAddPage.apply(this, args as any);
      drawBackground();
      return result;
    };

    // Draw on first page
    drawBackground();
    doc.setTextColor(255, 255, 255);

    // --- 2. Logo & Branding ---
    try {
      const res = await fetch(logo.src);
      const blob = await res.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64, "JPEG", 14, 15, 12, 12);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CONSOLE X ACADEMIA", 30, 23);
    } catch (err) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CONSOLE X ACADEMIA", 14, 23);
    }

    // --- 3. Header & Metadata ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    // Add title right below logo area
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 14, 40);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);

    // Robustly extract student info from likely paths
    const studentInfo =
      data.attendance?.student_info ||
      data.timetable?.student_info ||
      data.student_info ||
      {};

    doc.text(`Name: ${studentInfo.name || 'N/A'}`, 14, 48);
    doc.text(`Reg No: ${studentInfo.registration_number || 'N/A'}`, 14, 53);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 58);

    // --- 4. Content Generation ---
    const formatNumber = (value: number) => value.toFixed(2);
    generateContent(doc, formatNumber, autoTable);

    // --- 5. Output ---
    if (action === 'share') {
      const pdFBlob = doc.output('blob');
      const file = new File([pdFBlob], `${title.replace(/\s+/g, '-').toLowerCase()}.pdf`, { type: "application/pdf" });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: title,
          text: `Check out my ${title} from Console X Academia.`,
        });
      } else {
        alert("Sharing is not supported on this device. The file will be downloaded.");
        doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      }
    } else {
      doc.save(`${title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    }

    onComplete();
  } catch (error) {
    console.error("PDF generation failed", error);
    onError();
  }
};
