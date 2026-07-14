import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchDeliveryZones, createDeliveryZone, editDeliveryZone, removeDeliveryZone } from '../../redux/services/deliveryZonesService';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';
import AccessDenied from '../AccessDenied';
import api from '../../api/axiosInstance';
import * as XLSX from 'xlsx';

const BLANK = { pincode: '', deliveryCharge: '', status: 'Active' };

export default function DeliveryZones({ showToast }) {
  const dispatch = useDispatch();
  const { items: rows, loading } = useSelector(state => state.deliveryZones);

  const [showForm, setShowForm]             = useState(false);
  const [showBulkImport, setShowBulkImport]   = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [form, setForm]                     = useState({ ...BLANK });
  const [errors, setErrors]                 = useState({});

  // Bulk import state
  const [importFile, setImportFile]         = useState(null);
  const [importPreview, setImportPreview]   = useState([]);
  const [importErrors, setImportErrors]     = useState([]);
  const [overwriteMode, setOverwriteMode]   = useState(false);
  const [importing, setImporting]           = useState(false);

  useEffect(() => { dispatch(fetchDeliveryZones()); }, [dispatch]);

  if (!hasPermission('coupons_view')) {
    return <AccessDenied moduleName="Delivery Zones" />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next = {};
    if (!form.pincode.trim()) next.pincode = 'Please enter pincode(s) or ranges';
    if (form.deliveryCharge === '' || isNaN(Number(form.deliveryCharge)))
      next.deliveryCharge = 'Enter a valid charge (use 0 for free delivery)';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...BLANK });
    setErrors({});
  };

  const resetBulkImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
    setOverwriteMode(false);
    setImporting(false);
    setShowBulkImport(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...BLANK });
    setErrors({});
    setShowForm(true);
    setShowBulkImport(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (z) => {
    setEditingId(z.id);
    setForm({ pincode: z.pincode || '', deliveryCharge: z.deliveryCharge, status: z.status });
    setErrors({});
    setShowForm(true);
    setShowBulkImport(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const tid = showToast.loading(editingId ? 'Updating zone…' : 'Adding zone…');
    try {
      const payload = { ...form, deliveryCharge: parseFloat(form.deliveryCharge) };
      if (editingId) {
        await dispatch(editDeliveryZone({ id: editingId, data: payload }));
        showToast.success('Zone updated!', tid);
      } else {
        await dispatch(createDeliveryZone(payload));
        showToast.success('Zone added!', tid);
      }
      resetForm();
      dispatch(fetchDeliveryZones());
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Failed', tid);
    }
  };

  const handleDelete = (id) => {
    confirmDelete({
      title: 'Delete Zone?',
      message: 'This delivery zone will be permanently deleted.',
      onConfirm: async () => {
        const tid = showToast.loading('Deleting…');
        try {
          await dispatch(removeDeliveryZone(id));
          showToast.success('Deleted!', tid);
        } catch (err) {
          showToast.error('Failed to delete', tid);
        }
      },
    });
  };

  // Bulk template download
  const handleDownloadTemplate = () => {
    const headers = ["pincode", "deliveryCharge", "status"];
    const sampleData = [
      ["641104", 45, "Active"],
      ["641001-641010", 55, "Active"],
      ["600*", 35, "Active"],
      ["110001, 110002", 0, "Active"]
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Delivery Zones");
    XLSX.writeFile(wb, "delivery_zones_template.xlsx");
    showToast.success("Template downloaded!");
  };

  // Bulk Excel parsing
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const parsed = [];
        const errs = [];
        json.forEach((row, index) => {
          const rowNum = index + 2;
          const pincode = row.pincode !== undefined ? row.pincode : (row.Pincode !== undefined ? row.Pincode : row.PINCODE);
          const charge = row.deliveryCharge !== undefined ? row.deliveryCharge : (row.delivery_charge !== undefined ? row.delivery_charge : row.charge);
          const status = row.status || row.Status || "Active";

          const errorsInRow = [];
          if (pincode === undefined || pincode === null || String(pincode).trim() === "") {
            errorsInRow.push("Pincode is missing");
          }
          if (charge === undefined || isNaN(Number(charge))) {
            errorsInRow.push("Delivery charge must be a valid number");
          }

          if (errorsInRow.length > 0) {
            errs.push(`Row ${rowNum}: ${errorsInRow.join(', ')}`);
          }

          parsed.push({
            pincode: pincode !== undefined && pincode !== null ? String(pincode).trim() : '',
            deliveryCharge: parseFloat(charge) || 0,
            status: String(status).trim() || 'Active',
            isValid: errorsInRow.length === 0
          });
        });

        setImportPreview(parsed);
        setImportErrors(errs);
        if (errs.length > 0) {
          showToast.warn(`Found ${errs.length} validation issues in Excel.`);
        } else {
          showToast.success(`Successfully parsed ${parsed.length} rows.`);
        }
      } catch (error) {
        console.error(error);
        showToast.error("Failed to parse Excel file. Ensure it is a valid format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Bulk Excel upload execution
  const handleUploadImport = async () => {
    if (importPreview.length === 0) {
      showToast.error("No valid data to upload");
      return;
    }
    const invalidCount = importPreview.filter(p => !p.isValid).length;
    if (invalidCount > 0) {
      showToast.error(`Please fix the ${invalidCount} error(s) in your file first.`);
      return;
    }

    const tid = showToast.loading("Uploading bulk zones…");
    setImporting(true);
    try {
      const payload = {
        zones: importPreview.map(p => ({
          pincode: p.pincode,
          deliveryCharge: p.deliveryCharge,
          status: p.status
        })),
        overwrite: overwriteMode
      };

      const res = await api.post("/delivery-zones/admin/bulk-create", payload);
      showToast.success(res?.data?.message || "Successfully uploaded zones!", tid);
      resetBulkImport();
      dispatch(fetchDeliveryZones());
    } catch (err) {
      showToast.error(err?.response?.data?.message || 'Bulk upload failed', tid);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="categories-container">
      <div className="section-header">
        <div className="section-title">Delivery Zone Charges (Pincode-wise)</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showBulkImport) resetBulkImport(); else { setShowBulkImport(true); setShowForm(false); } }}
            style={{ background: '#486cea', borderColor: '#16a34a', color : '#ffff' }}
          >
            {showBulkImport ? 'Close Import' : ' Excel Import'}
          </button>
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else openAdd(); }}
          >
            {showForm ? 'Close' : '+ Add Zone'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">🚚</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Delivery Zone' : 'Add Delivery Zone'}</div>
              <div className="km-form-header-sub">Set pincode-wise delivery charge</div>
            </div>
          </div>

          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>

              {/* Pincode */}
              <div className="km-field km-field-full">
                <label className="km-label">Pincode(s) / Wildcards / Ranges *</label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  placeholder="e.g. 641104, 641001-641010, 600*"
                  className={`km-input${errors.pincode ? ' km-input-error' : ''}`}
                />
                {errors.pincode && <div className="km-error-msg">⚠ {errors.pincode}</div>}
                <span style={{ fontSize: 11, color: '#888', marginTop: 4, display: 'block' }}>
                  Supports: Single pincodes (<code>641104</code>), comma-separated lists (<code>641104, 600001</code>), ranges (<code>641001-641010</code>), or wildcard prefix (<code>600*</code>).
                </span>
              </div>

              {/* Delivery Charge */}
              <div className="km-field">
                <label className="km-label">Delivery Charge (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="deliveryCharge"
                  value={form.deliveryCharge}
                  onChange={handleChange}
                  placeholder="e.g. 50 (use 0 for free)"
                  className={`km-input${errors.deliveryCharge ? ' km-input-error' : ''}`}
                />
                {errors.deliveryCharge && <div className="km-error-msg">⚠ {errors.deliveryCharge}</div>}
                <span style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Enter 0 for free delivery</span>
              </div>

              {/* Status */}
              <div className="km-field">
                <label className="km-label">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="km-input"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Form Actions */}
              <div className="km-form-actions" style={{ display: 'flex' }}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Zone' : 'Save Zone'}
                </button>
                <button type="button" className="km-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkImport && (
        <div className="km-form-card fade-in" style={{ borderColor: '#16a34a' }}>
          <div className="km-form-header" style={{ borderBottomColor: 'rgba(22,163,74,0.1)' }}>
            <div className="km-form-header-icon">📊</div>
            <div>
              <div className="km-form-header-title">Excel Bulk Import</div>
              <div className="km-form-header-sub">Upload delivery charges in bulk via spreadsheet</div>
            </div>
          </div>

          <div className="km-form-body">
            <div className="import-grid">
              
              {/* Step 1: Template Card */}
              <div className="import-card template-card">
                <div className="import-card-icon">📥</div>
                <h4 className="import-card-title">1. Get the Template</h4>
                <p className="import-card-desc">Download our formatted Excel template to ensure your data imports correctly.</p>
                <button 
                  type="button" 
                  onClick={handleDownloadTemplate} 
                  className="import-btn btn-template"
                >
                  Download Excel Template
                </button>
              </div>

              {/* Step 2: Upload Card */}
              <div className="import-card upload-card">
                <div className="import-card-icon">📤</div>
                <h4 className="import-card-title">2. Upload File</h4>
                <p className="import-card-desc">Select or drag in your filled Excel template to preview and upload.</p>
                
                <label className="file-dropzone">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={handleFileChange} 
                    className="file-hidden-input"
                  />
                  <div className="dropzone-content">
                    <span className="dropzone-cloud">☁️</span>
                    <span className="dropzone-text">
                      {importFile ? `Selected: ${importFile.name}` : 'Click to browse Excel file'}
                    </span>
                    {importFile && (
                      <span className="dropzone-size">
                        ({(importFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>
                </label>
              </div>

            </div>

            {importPreview.length > 0 && (
              <div className="fade-in" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontWeight: 600 }}>Parsed Rows Preview ({importPreview.length} items)</div>
                  
                  {/* Mode selector */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: '#f1f5f9', padding: '6px 12px', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                      <input 
                        type="radio" 
                        name="overwriteMode" 
                        checked={!overwriteMode} 
                        onChange={() => setOverwriteMode(false)}
                      />
                      Merge &amp; Update
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#ef4444' }}>
                      <input 
                        type="radio" 
                        name="overwriteMode" 
                        checked={overwriteMode} 
                        onChange={() => setOverwriteMode(true)}
                      />
                      Overwrite All
                    </label>
                  </div>
                </div>

                {importErrors.length > 0 && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px', maxHeight: '120px', overflowY: 'auto' }}>
                    <div style={{ color: '#991b1b', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>⚠️ Validation Issues Found:</div>
                    {importErrors.map((err, idx) => (
                      <div key={idx} style={{ color: '#b91c1c', fontSize: '12px', margin: '2px 0' }}>• {err}</div>
                    ))}
                  </div>
                )}

                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px' }}>Pincode</th>
                        <th style={{ padding: '8px 12px' }}>Delivery Charge</th>
                        <th style={{ padding: '8px 12px' }}>Status</th>
                        <th style={{ padding: '8px 12px' }}>Validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importPreview.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', background: item.isValid ? 'inherit' : '#fef2f2' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{item.pincode || <span style={{ color: '#ef4444' }}>Missing</span>}</td>
                          <td style={{ padding: '8px 12px' }}>₹{item.deliveryCharge.toFixed(2)}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span className={`status-pill ${item.status === 'Active' ? 'pill-active' : 'pill-inactive'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {item.isValid ? (
                              <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Valid</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Invalid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={handleUploadImport} 
                    disabled={importing || importErrors.length > 0} 
                    className="km-btn-submit"
                    style={{ background: '#16a34a', opacity: importing || importErrors.length > 0 ? 0.6 : 1 }}
                  >
                    {importing ? 'Uploading…' : 'Upload & Process Excel'}
                  </button>
                  <button type="button" onClick={resetBulkImport} className="km-btn-cancel">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading delivery zones...</p>
      ) : (
        <DataTable
          columns={['#', 'Pincode(s)', 'Delivery Charge', 'Status', 'Actions']}
          initialRows={rows}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>📍</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{row.pincode || '—'}</span>
                    {row.state && <span style={{ fontSize: 11, color: '#666' }}>({row.state})</span>}
                  </div>
                </div>
              </td>
              <td style={{ fontWeight: 700, color: Number(row.deliveryCharge) === 0 ? '#16a34a' : undefined }}>
                {Number(row.deliveryCharge) === 0 ? '🎉 Free' : `₹${parseFloat(row.deliveryCharge).toFixed(2)}`}
              </td>
              <td>
                <span className={`status-pill ${row.status === 'Active' ? 'pill-active' : 'pill-inactive'}`}>
                  {row.status}
                </span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="action-btn btn-edit" onClick={() => openEdit(row)}>Edit</button>
                  <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <style>{`
        .km-form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .km-field-full {
          grid-column: span 2;
        }

        .km-error-msg {
          color: #ef4444;
          font-size: 12px;
          margin-top: 6px;
        }

        .km-input-error {
          border-color: #ef4444 !important;
        }

        .km-form-actions {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
          padding-top: 20px;
          border-top: 1px solid rgba(0,0,0,0.05);
        }

        .km-btn-submit {
          padding: 10px 24px;
          background: #487fff;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .km-btn-cancel {
          padding: 10px 24px;
          background: #f1f1f1;
          color: #333;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .km-btn-submit:hover, .km-btn-cancel:hover {
          opacity: 0.8;
        }

        .fade-in {
          animation: kmFadeIn 0.3s ease-out;
        }

        @keyframes kmFadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Bulk Import Premium Styles */
        .import-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 24px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .import-grid {
            grid-template-columns: 1fr;
          }
        }

        .import-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .import-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
          border-color: #cbd5e1;
        }

        .template-card {
          border-top: 4px solid #3b82f6;
        }

        .upload-card {
          border-top: 4px solid #16a34a;
        }

        .import-card-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .import-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }

        .import-card-desc {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .import-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          width: 100%;
        }

        .btn-template {
          background: #3b82f6;
          color: white;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        }

        .btn-template:hover {
          background: #2563eb;
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }

        .file-dropzone {
          width: 100%;
          border: 2px dashed #cbd5e1;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          background: #f8fafc;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 100px;
        }

        .file-dropzone:hover {
          border-color: #16a34a;
          background: #f0fdf4;
        }

        .file-hidden-input {
          display: none;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .dropzone-cloud {
          font-size: 24px;
        }

        .dropzone-text {
          font-size: 13px;
          font-weight: 600;
          color: #475569;
        }

        .dropzone-size {
          font-size: 11px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
