import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from '../DataTable/DataTable';
import { fetchMarquees, createMarquee, editMarquee, removeMarquee } from '../../redux/services/marqueeService';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';

const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB', blue: '#1A3A6B',
  green: '#39B54A', teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280', bg: '#F9FAFB',
};

const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5 };
const labelStyle = { fontSize: 11, fontWeight: 500, color: KM.muted, textTransform: 'uppercase', letterSpacing: '0.05em' };
const inputStyle = { padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8, fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', textTransform: 'capitalize' };

// Helper: Count words in text
const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

// Helper: Get field limits
const LIMITS = {
  message: { chars: 120, words: 20 },
};

// Validate text length and word count
const validateField = (field, value) => {
  const limits = LIMITS[field];
  if (!limits) return null;
  
  const charCount = value.length;
  const wordCount = countWords(value);
  
  if (charCount > limits.chars) return `Max ${limits.chars} characters (you have ${charCount})`;
  if (wordCount > limits.words) return `Max ${limits.words} words (you have ${wordCount})`;
  return null;
};

export default function Marquee({ showToast }) {
  const dispatch = useDispatch();
  const { items: marquees, loading } = useSelector(state => state.marquee || { items: [], loading: false });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMarquees());
  }, [dispatch]);

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setMessage('');
    setIsActive(true);
    setErrors({});
  };

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setMessage(row.message || '');
    setIsActive(row.isActive ?? true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!message.trim()) newErrors.message = 'Message is required';
    else {
      const msgErr = validateField('message', message);
      if (msgErr) newErrors.message = msgErr;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast.error(Object.values(newErrors)[0]);
      return;
    }
    
    setErrors({});

    const data = { message: message.trim(), isActive };
    const toastId = showToast.loading(editingId ? 'Updating message...' : 'Adding message...');
    
    try {
      if (editingId) {
        await dispatch(editMarquee({ id: editingId, data }));
        showToast.success('Message updated', toastId);
      } else {
        await dispatch(createMarquee(data));
        showToast.success('Message added', toastId);
      }
      resetForm();
      dispatch(fetchMarquees());
    } catch (err) {
      showToast.error(err?.response?.data?.message || err?.message || 'Operation failed', toastId);
    }
  };

  const handleDelete = (marqueeId) => {
    confirmDelete({
      title: 'Delete Marquee Message?',
      message: 'Are you sure you want to delete this message?',
      onConfirm: async () => {
        try {
          await dispatch(removeMarquee(marqueeId));
        } catch (err) {
          console.error('Failed to delete message:', err);
        }
      },
    });
  };

  const rows = Array.isArray(marquees) ? marquees : [];

  return (
    <div className="categories-container">
      
      <div className="section-header">
        <div className="section-title">Marquee Messages</div>
        {hasPermission('marquee_create') && (
          <button
            className="action-btn btn-edit"
            onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          >
            {showForm ? 'Close' : '+ Add Message'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : '📢'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Message' : 'Add New Marquee Message'}</div>
              <div className="km-form-header-sub">Fill in the details below</div>
            </div>
          </div>
          
          <div className="km-form-body">
            <form className="km-form-grid" onSubmit={handleSubmit}>
              <div className="km-field km-field-full">
                <label className="km-label">
                  Message Text
                  <span style={{ fontSize: 11, color: errors.message ? '#ef4444' : '#9ca3af', marginLeft: 8 }}>
                    {message.length}/{LIMITS.message.chars} chars · {countWords(message)}/{LIMITS.message.words} words
                  </span>
                </label>
                <textarea
                  className="km-input"
                  placeholder="e.g. Free delivery on orders over ₹500"
                  value={message}
                  onChange={e => {
                    const val = e.target.value;
                    setMessage(val);
                    const err = validateField('message', val);
                    setErrors(prev => ({ ...prev, message: err }));
                  }}
                  rows={3}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', borderColor: errors.message ? '#ef4444' : undefined, boxShadow: errors.message ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : undefined }}
                  maxLength={LIMITS.message.chars}
                />
                {errors.message && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>⚠ {errors.message}</div>}
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">Status</label>
                <select 
                  className="km-input"
                  value={isActive ? 'true' : 'false'}
                  onChange={e => setIsActive(e.target.value === 'true')}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="km-form-actions km-field-full" style={{ display: 'flex' , gap : "10px"}}>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Update Message' : 'Save Message'}
                </button>
                <button type="button" className="km-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="km-loading">Loading marquee messages...</p>
      ) : (
        <DataTable
          columns={(() => {
            const cols = ['No.', 'Message', 'Status'];
            if (hasPermission('marquee_edit') || hasPermission('marquee_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={rows}
          renderRow={(row, i) => (
            <tr key={row.id}>
              <td className="td-id">{i + 1}</td>
              <td>
                <span style={{ fontSize: '13px', color: KM.text, maxWidth: '400px', display: 'block', wordBreak: 'break-word' }}>
                  {row.message}
                </span>
              </td>
              <td>
                <span className={`status-pill ${row.isActive ? 'pill-active' : 'pill-inactive'}`}>
                  {row.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              {(hasPermission('marquee_edit') || hasPermission('marquee_delete')) && (
                <td>
                  <div style={{ display: 'flex', gap: '8px'}}>
                    {hasPermission('marquee_edit') && (
                      <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                    )}
                    {hasPermission('marquee_delete') && (
                      <button className="action-btn btn-del" onClick={() => handleDelete(row.id)}>Delete</button>
                    )}
                  </div>
                </td>
              )}
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

        .status-pill {
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
          padding: 3px 10px;
          display: inline-block;
        }

        .status-pill.pill-active {
          background: rgba(69, 179, 105, 0.15);
          color: #45b369;
        }

        .status-pill.pill-inactive {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        @media (max-width: 600px) {
          .km-form-grid {
            grid-template-columns: 1fr;
          }

          .km-field-full {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
}
