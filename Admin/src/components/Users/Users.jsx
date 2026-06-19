import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import api from '../../api/axiosInstance';
import { confirmDelete } from '../../utils/sweetalert';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { hasPermission } from '../../utils/authHelper';

export default function Users({ showToast }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('active');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data || []);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data || []);
    } catch (err) {
      console.error('Failed to load roles for select dropdown:', err);
    }
  };

  const handleEditClick = (user) => {
    setEditingId(user.id);
    setName(user.name || '');
    setEmail(user.email || '');
    setPassword(''); // leave blank for no password change
    setRoleId(user.roleId || '');
    setStatus(user.status || 'active');
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id, userName) => {
    confirmDelete({
      title: 'Delete Admin User?',
      message: `Are you sure you want to delete the user account for "${userName}"?`,
      onConfirm: async () => {
        const toastId = showToast.loading('Deleting user...');
        try {
          await api.delete(`/users/${id}`);
          showToast.success('User deleted successfully', toastId);
          fetchUsers();
        } catch (err) {
          showToast.error(err.response?.data?.message || 'Failed to delete user', toastId);
        }
      },
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name || !name.trim()) newErrors.name = 'Name is required';
    if (!email || !email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email format is invalid';
    }

    if (!editingId && (!password || !password.trim())) {
      newErrors.password = 'Password is required for new users';
    } else if (password && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!roleId) newErrors.roleId = 'A role must be assigned';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showToast.error(Object.values(newErrors)[0]);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      name: name.trim(),
      email: email.trim(),
      roleId,
      status,
    };

    if (password && password.trim()) {
      data.password = password;
    }

    const toastId = showToast.loading(editingId ? 'Updating user details...' : 'Creating user...');
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, data);
        showToast.success('User updated successfully', toastId);
      } else {
        await api.post('/users', data);
        showToast.success('User created successfully', toastId);
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Operation failed', toastId);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setEmail('');
    setPassword('');
    setRoleId('');
    setStatus('active');
    setShowForm(false);
    setShowPassword(false);
    setErrors({});
  };

  return (
    <div className="users-container fade-in">
      <div className="section-header">
        <div className="section-title">Admin Users</div>
        {(hasPermission('users_create') || showForm) && (
          <button
            className="action-btn btn-edit"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
          >
            {showForm ? 'Close' : '+ Add User'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'U'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Administrative User' : 'Add Administrative User'}</div>
              <div className="km-form-header-sub">Provide name, email, credentials and set role permissions</div>
            </div>
          </div>

          <div className="km-form-body">
            <form onSubmit={handleSubmit} className="km-form-grid">
              <div className="km-field">
                <label className="km-label">Full Name</label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. John Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ textTransform: 'none' }}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="km-field">
                <label className="km-label">Email Address</label>
                <input
                  className="km-input"
                  type="email"
                  placeholder="e.g. johndoe@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ textTransform: 'none' }}
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="km-field">
                <label className="km-label">
                  Password {editingId && <span style={{ fontSize: 11, color: 'var(--neutral-400)', fontWeight: 'normal' }}>(leave blank to keep current)</span>}
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    className="km-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingId ? '••••••' : 'Create a secure password'}
                    required={!editingId}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ textTransform: 'none', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--neutral-500)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                  >
                    {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="km-field">
                <label className="km-label">Assigned Role</label>
                <select
                  className="km-select"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {errors.roleId && <span className="error-text">{errors.roleId}</span>}
              </div>

              <div className="km-field km-field-full">
                <label className="km-label">Account Status</label>
                <select
                  className="km-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active (Permit Login)</option>
                  <option value="inactive">Inactive (Block Login)</option>
                </select>
              </div>

              <div className="km-form-actions">
                <button type="button" className="km-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <DataTable
          columns={(() => {
            const cols = ['ID', 'Name', 'Email Address', 'Role', 'Status'];
            if (hasPermission('users_edit') || hasPermission('users_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={users}
          loading={loading}
          renderRow={(row, idx) => {
            const isActive = row.status === 'active';
            return (
              <tr key={row.id} className="tRow">
                <td className="td-id">{idx + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{row.name}</td>
                <td>{row.email}</td>
                <td>
                  <span className="status-pill pill-approved" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
                    {row.roleRecord?.name || 'Super Admin'}
                  </span>
                </td>
                <td>
                  <span className={`status-pill ${isActive ? 'pill-approved' : 'pill-cancelled'}`} style={{
                    background: isActive ? 'var(--success-surface)' : 'var(--danger-50)',
                    color: isActive ? 'var(--success-600)' : 'var(--danger-600)'
                  }}>
                    {row.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                {(hasPermission('users_edit') || hasPermission('users_delete')) && (
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {hasPermission('users_edit') && (
                        <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                      )}
                      {hasPermission('users_delete') && (
                        <button className="action-btn btn-del" onClick={() => handleDelete(row.id, row.name)}>Delete</button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          }}
        />
      )}

      <style>{`
        .users-container {
          padding: 4px 0;
        }
        .error-text {
          color: var(--danger-600);
          font-size: 12px;
          margin-top: 4px;
        }
        .km-form-actions {
          grid-column: span 2;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 18px;
          border-top: 1px solid var(--border-color);
        }
        .km-btn-submit {
          width: auto !important;
          margin-top: 0 !important;
        }
        .km-btn-cancel {
          width: auto !important;
        }
        .tRow td {
          padding: 12px 16px;
        }
      `}</style>
    </div>
  );
}
