import { useState, useEffect } from 'react';
import DataTable from '../DataTable/DataTable';
import api from '../../api/axiosInstance';
import { confirmDelete } from '../../utils/sweetalert';
import { hasPermission } from '../../utils/authHelper';

const PERMISSION_GROUPS = [
  {
    module: "Products",
    permissions: [
      { key: "products_view", label: "View Products" },
      { key: "products_create", label: "Add Product" },
      { key: "products_edit", label: "Edit Product" },
      { key: "products_delete", label: "Delete Product" }
    ]
  },
  {
    module: "Combos",
    permissions: [
      { key: "combos_view", label: "View Combos" },
      { key: "combos_create", label: "Add Combo" },
      { key: "combos_edit", label: "Edit Combo" },
      { key: "combos_delete", label: "Delete Combo" }
    ]
  },
  {
    module: "Variants",
    permissions: [
      { key: "variants_view", label: "View Variants" },
      { key: "variants_create", label: "Add Variant" },
      { key: "variants_edit", label: "Edit Variant" },
      { key: "variants_delete", label: "Delete Variant" }
    ]
  },
  {
    module: "Stock",
    permissions: [
      { key: "stock_view", label: "View Stock" },
      { key: "stock_edit", label: "Edit Stock" }
    ]
  },
  {
    module: "Categories & Brands",
    permissions: [
      { key: "categories_view", label: "View Categories" },
      { key: "categories_create", label: "Add Category" },
      { key: "categories_edit", label: "Edit Category" },
      { key: "categories_delete", label: "Delete Category" },
      { key: "subcategories_view", label: "View Subcategories" },
      { key: "subcategories_create", label: "Add Subcategory" },
      { key: "subcategories_edit", label: "Edit Subcategory" },
      { key: "subcategories_delete", label: "Delete Subcategory" },
      { key: "brands_view", label: "View Brands" },
      { key: "brands_create", label: "Add Brand" },
      { key: "brands_edit", label: "Edit Brand" },
      { key: "brands_delete", label: "Delete Brand" }
    ]
  },
  {
    module: "Coupons & Marketing",
    permissions: [
      { key: "coupons_view", label: "View Coupons" },
      { key: "coupons_create", label: "Add Coupon" },
      { key: "coupons_edit", label: "Edit Coupon" },
      { key: "coupons_delete", label: "Delete Coupon" },
      { key: "marquee_view", label: "View Slider Messages" },
      { key: "marquee_create", label: "Add Slider Message" },
      { key: "marquee_edit", label: "Edit Slider Message" },
      { key: "marquee_delete", label: "Delete Slider Message" },
      { key: "banners_view", label: "View Banners" },
      { key: "banners_create", label: "Add Banner" },
      { key: "banners_edit", label: "Edit Banner" },
      { key: "banners_delete", label: "Delete Banner" },
      { key: "timeless_view", label: "View Timeless Treasures" },
      { key: "timeless_create", label: "Add Timeless Treasure" },
      { key: "timeless_edit", label: "Edit Timeless Treasure" },
      { key: "timeless_delete", label: "Delete Timeless Treasure" },
      { key: "testimonials_view", label: "View Testimonials" },
      { key: "testimonials_create", label: "Add Testimonial" },
      { key: "testimonials_edit", label: "Edit Testimonial" },
      { key: "testimonials_delete", label: "Delete Testimonial" }
    ]
  },
  {
    module: "Orders & Returns",
    permissions: [
      { key: "orders_view", label: "View Orders" },
      { key: "orders_edit", label: "Edit / Update Orders" },
      { key: "returns_view", label: "View Returns" },
      { key: "returns_edit", label: "Process Returns" }
    ]
  },
  {
    module: "Reports",
    permissions: [
      { key: "reports_view", label: "View Sales Reports" },
      { key: "reports_export", label: "Export Sales Reports" }
    ]
  },
  {
    module: "User & Role Management",
    permissions: [
      { key: "roles_view", label: "View Roles" },
      { key: "roles_create", label: "Add Role" },
      { key: "roles_edit", label: "Edit Role" },
      { key: "roles_delete", label: "Delete Role" },
      { key: "users_view", label: "View Admin Users" },
      { key: "users_create", label: "Add Admin User" },
      { key: "users_edit", label: "Edit Admin User" },
      { key: "users_delete", label: "Delete Admin User" }
    ]
  },
  {
    module: "Support & Reviews",
    permissions: [
      { key: "contacts_view", label: "View Contact Requests" },
      { key: "contacts_delete", label: "Delete Contact Request" },
      { key: "reviews_view", label: "View Product Reviews" },
      { key: "reviews_edit", label: "Moderate Product Reviews" },
      { key: "reviews_delete", label: "Delete Product Review" }
    ]
  },
  {
    module: "Font Management",
    permissions: [
      { key: "fonts_view", label: "View Fonts" },
      { key: "fonts_create", label: "Add Font" },
      { key: "fonts_edit", label: "Edit Font" },
      { key: "fonts_delete", label: "Delete Font" }
    ]
  },
  {
    module: "Site Settings",
    permissions: [
      { key: "settings_view", label: "View Settings" },
      { key: "settings_edit", label: "Edit Settings" }
    ]
  },
  {
    module: "Customisation Fields",
    permissions: [
      { key: "customisation_fields_view", label: "View Customisation Fields" },
      { key: "customisation_fields_create", label: "Add Customisation Field" },
      { key: "customisation_fields_edit", label: "Edit Customisation Field" },
      { key: "customisation_fields_delete", label: "Delete Customisation Field" }
    ]
  }
];

export default function Roles({ showToast }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data || []);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (role) => {
    if (role.name === 'Super Admin') {
      showToast.error('Super Admin role cannot be modified');
      return;
    }
    setEditingId(role.id);
    setRoleName(role.name);
    let perms = role.permissions || [];
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch {
        perms = [];
      }
    }
    setSelectedPermissions(perms);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = async (id, name) => {
    if (name === 'Super Admin') {
      showToast.error('Super Admin role cannot be deleted');
      return;
    }
    confirmDelete({
      title: 'Delete Role?',
      message: `Are you sure you want to delete the role "${name}"?`,
      onConfirm: async () => {
        const toastId = showToast.loading('Deleting role...');
        try {
          await api.delete(`/roles/${id}`);
          showToast.success('Role deleted successfully', toastId);
          fetchRoles();
        } catch (err) {
          showToast.error(err.response?.data?.message || 'Failed to delete role', toastId);
        }
      },
    });
  };

  const handleCheckboxChange = (permKey) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permKey)) {
        return prev.filter((p) => p !== permKey);
      } else {
        return [...prev, permKey];
      }
    });
  };

  const handleSelectAllModule = (modulePerms, selectAll) => {
    const permKeys = modulePerms.map((p) => p.key);
    setSelectedPermissions((prev) => {
      if (selectAll) {
        // Add all keys from module that aren't already selected
        const toAdd = permKeys.filter((k) => !prev.includes(k));
        return [...prev, ...toAdd];
      } else {
        // Remove all keys of this module
        return prev.filter((k) => !permKeys.includes(k));
      }
    });
  };

  const handleSelectAllGlobal = (selectAll) => {
    if (selectAll) {
      const allKeys = [];
      PERMISSION_GROUPS.forEach((g) => {
        g.permissions.forEach((p) => allKeys.push(p.key));
      });
      setSelectedPermissions(allKeys);
    } else {
      setSelectedPermissions([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!roleName || !roleName.trim()) {
      newErrors.name = 'Role name is required';
    } else {
      const nameLower = roleName.trim().toLowerCase();
      // Check for duplicates
      const dup = roles.find(
        (r) => r.name.toLowerCase() === nameLower && r.id !== editingId
      );
      if (dup) {
        newErrors.name = 'Role with this name already exists';
      }
    }

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
      name: roleName.trim(),
      permissions: selectedPermissions,
    };

    const toastId = showToast.loading(editingId ? 'Updating role...' : 'Creating role...');
    try {
      if (editingId) {
        await api.put(`/roles/${editingId}`, data);
        showToast.success('Role updated successfully', toastId);
      } else {
        await api.post('/roles', data);
        showToast.success('Role created successfully', toastId);
      }
      resetForm();
      fetchRoles();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Operation failed', toastId);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setRoleName('');
    setSelectedPermissions([]);
    setShowForm(false);
    setErrors({});
  };

  const allPermsList = [];
  PERMISSION_GROUPS.forEach((g) => g.permissions.forEach((p) => allPermsList.push(p.key)));
  const isAllGlobalSelected = allPermsList.length > 0 && allPermsList.every((k) => selectedPermissions.includes(k));

  return (
    <div className="roles-container fade-in">
      <div className="section-header">
        <div className="section-title">Roles & Permissions</div>
        {(hasPermission('roles_create') || showForm) && (
          <button
            className="action-btn btn-edit"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
          >
            {showForm ? 'Close' : '+ Add Role'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="km-form-card fade-in">
          <div className="km-form-header">
            <div className="km-form-header-icon">{editingId ? '✎' : 'R'}</div>
            <div>
              <div className="km-form-header-title">{editingId ? 'Edit Role' : 'Add New Role'}</div>
              <div className="km-form-header-sub">Configure role name and access permissions</div>
            </div>
          </div>

          <div className="km-form-body">
            <form onSubmit={handleSubmit}>
              <div className="km-field km-field-full" style={{ marginBottom: 24 }}>
                <label className="km-label">Role Name</label>
                <input
                  className="km-input"
                  type="text"
                  placeholder="e.g. Sales Manager"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  style={{ textTransform: 'none' }}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="permissions-section">
                <div className="permissions-header">
                  <div className="km-label" style={{ fontSize: 13, color: 'var(--neutral-800)' }}>Permissions Grid</div>
                  <label className="checkbox-label select-all-global">
                    <input
                      type="checkbox"
                      checked={isAllGlobalSelected}
                      onChange={(e) => handleSelectAllGlobal(e.target.checked)}
                    />
                    <span>Select All Permissions</span>
                  </label>
                </div>

                <div className="modules-grid">
                  {PERMISSION_GROUPS.map((group) => {
                    const isAllModuleSelected = group.permissions.every((p) =>
                      selectedPermissions.includes(p.key)
                    );
                    const isAnyModuleSelected = group.permissions.some((p) =>
                      selectedPermissions.includes(p.key)
                    );

                    return (
                      <div key={group.module} className="module-card">
                        <div className="module-header">
                          <span className="module-name">{group.module}</span>
                          <label className="checkbox-label select-all-module">
                            <input
                              type="checkbox"
                              checked={isAllModuleSelected}
                              ref={(el) => {
                                if (el) {
                                  el.indeterminate = isAnyModuleSelected && !isAllModuleSelected;
                                }
                              }}
                              onChange={(e) => handleSelectAllModule(group.permissions, e.target.checked)}
                            />
                            <span>All</span>
                          </label>
                        </div>
                        <div className="module-body">
                          {group.permissions.map((p) => (
                            <label key={p.key} className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(p.key)}
                                onChange={() => handleCheckboxChange(p.key)}
                              />
                              <span>{p.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="km-form-actions">
                <button type="button" className="km-btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="km-btn-submit">
                  {editingId ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        <DataTable
          columns={(() => {
            const cols = ['ID', 'Role Name', 'Permissions Granted'];
            if (hasPermission('roles_edit') || hasPermission('roles_delete')) cols.push('Actions');
            return cols;
          })()}
          initialRows={roles}
          loading={loading}
          renderRow={(row, idx) => {
            const isSuper = row.name === 'Super Admin';
            let perms = row.permissions || [];
            if (typeof perms === 'string') {
              try { perms = JSON.parse(perms); } catch { perms = []; }
            }

            return (
              <tr key={row.id} className="tRow">
                <td className="td-id">{idx + 1}</td>
                <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{row.name}</td>
                <td>
                  {isSuper ? (
                    <span className="status-pill pill-approved">All (*)</span>
                  ) : (
                    <span className="status-pill">{perms.length} Perms</span>
                  )}
                </td>
                {(hasPermission('roles_edit') || hasPermission('roles_delete')) && (
                  <td>
                    {!isSuper ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {hasPermission('roles_edit') && (
                          <button className="action-btn btn-edit" onClick={() => handleEditClick(row)}>Edit</button>
                        )}
                        {hasPermission('roles_delete') && (
                          <button className="action-btn btn-del" onClick={() => handleDelete(row.id, row.name)}>Delete</button>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--neutral-400)', fontStyle: 'italic' }}>System Default</span>
                    )}
                  </td>
                )}
              </tr>
            );
          }}
        />
      )}

      <style>{`
        .roles-container {
          padding: 4px 0;
        }
        .error-text {
          color: var(--danger-600);
          font-size: 12px;
          margin-top: 4px;
        }
        .permissions-section {
          background: var(--neutral-50);
          border: 1px solid var(--border-color);
          border-radius: var(--radius);
          padding: 20px;
          margin-bottom: 24px;
        }
        .permissions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--neutral-200);
          margin-bottom: 18px;
        }
        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .module-card {
          background: var(--base);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
        }
        .module-header {
          background: var(--neutral-100);
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
        }
        .module-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--neutral-800);
        }
        .module-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }
        .checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--neutral-600);
          cursor: pointer;
          user-select: none;
        }
        .checkbox-label input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: var(--primary-600);
          cursor: pointer;
        }
        .select-all-global {
          font-size: 12px;
          font-weight: 600;
          color: var(--primary-700);
        }
        .select-all-module {
          font-weight: 600;
        }
        .km-form-actions {
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
