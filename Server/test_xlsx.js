const XLSX = require("xlsx");

try {
  console.log("Creating sheet from empty array...");
  const ws = XLSX.utils.json_to_sheet([]);
  console.log("Successfully created sheet!");
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Test");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  console.log("Successfully wrote workbook of length:", buf.length);
} catch (e) {
  console.error("Failed:", e);
}
