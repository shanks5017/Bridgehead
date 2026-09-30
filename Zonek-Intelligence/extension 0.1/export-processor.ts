/**
 * Bridgehead Extension - Export Processor
 * Utilities for converting extraction maps to professional formats.
 */

export class ExportProcessor {
  /**
   * Converts an array of items to a CSV string.
   */
  static toCSV(items: any[]): string {
    if (items.length === 0) return "";

    const headers = [
      "Title",
      "Phone",
      "Address",
      "Price",
      "Link",
      "Image",
      "Quality Score"
    ];

    const rows = items.map(item => [
      item.title || "",
      item.phone || "",
      `"${(item.address || "").replace(/"/g, '""')}"`,
      item.price || "",
      item.link || "",
      item.image || "",
      item._qualityScore || 0
    ]);

    return [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
  }

  /**
   * Downloads a string as a file in the browser.
   */
  static download(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
