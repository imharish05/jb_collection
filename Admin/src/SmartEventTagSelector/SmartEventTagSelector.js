import { useState, useEffect, useRef } from 'react';

const KM = {
  orange: '#F15A24', orangeLight: '#FEF0EB',
  blue: '#1A3A6B', green: '#39B54A',
  teal: '#00B4D8', border: '#E5E7EB',
  text: '#1A1A2E', muted: '#6B7280',
};

const inputStyle = {
  padding: '9px 12px', border: `1px solid ${KM.border}`, borderRadius: 8,
  fontSize: 13, color: KM.text, background: '#fff', fontFamily: 'inherit', outline: 'none',
};

// ─── SIZE_UNITS — re-exported for Stock.js & Variants.js compatibility ───────
export const SIZE_UNITS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

// ─── Global Event Tag Store ───────────────────────────────────────────────────
const DEFAULT_TAG_GROUPS = [
  { type: 'Occasion',  icon: '🎉', tags: ['Birthday', 'Wedding', 'Anniversary', 'Graduation', 'Baby Shower', 'Engagement'], custom: false },
  { type: 'Season',    icon: '🌸', tags: ['Christmas', 'Diwali', 'Eid', 'Pongal', 'New Year', 'Valentine\'s'], custom: false },
  { type: 'Recipient', icon: '👤', tags: ['Him', 'Her', 'Kids', 'Parents', 'Friends', 'Couple', 'Corporate'], custom: false },
  { type: 'Vibe',      icon: '✨', tags: ['Luxury', 'Budget', 'Handmade', 'Personalised', 'Eco-Friendly'], custom: false },
];

let _tagGroups = [...DEFAULT_TAG_GROUPS];
const _tagGroupListeners = new Set();

export function getTagGroups() { return _tagGroups; }
export function notifyTagListeners() { _tagGroupListeners.forEach(fn => fn([..._tagGroups])); }

export function addCustomTagType(typeName) {
  _tagGroups = [..._tagGroups, { type: typeName, icon: '🏷️', tags: [], custom: true }];
  notifyTagListeners();
}
export function addTagToType(typeName, tag) {
  _tagGroups = _tagGroups.map(g =>
    g.type === typeName ? { ...g, tags: [...g.tags, tag] } : g
  );
  notifyTagListeners();
}
export function removeTagFromType(typeName, tag) {
  _tagGroups = _tagGroups.map(g =>
    g.type === typeName ? { ...g, tags: g.tags.filter(t => t !== tag) } : g
  );
  notifyTagListeners();
}
export function deleteCustomTagType(typeName) {
  _tagGroups = _tagGroups.filter(g => g.type !== typeName);
  notifyTagListeners();
}

// ─── SmartEventTagSelector Component ─────────────────────────────────────────
// Props:
//   value    : string[]          — currently selected tags
//   onChange : (tags: string[]) => void
export default function SmartEventTagSelector({ value = [], onChange }) {
  const [isOpen, setIsOpen]             = useState(false);
  const [openType, setOpenType]         = useState(null);
  const [tagGroups, setTagGroups]       = useState(getTagGroups());
  const [showAddType, setShowAddType]   = useState(false);
  const [newTypeName, setNewTypeName]   = useState('');
  const [addingTagTo, setAddingTagTo]   = useState(null);
  const [newTagName, setNewTagName]     = useState('');
  const containerRef                    = useRef(null);

  useEffect(() => {
    const listener = (groups) => setTagGroups([...groups]);
    _tagGroupListeners.add(listener);
    return () => _tagGroupListeners.delete(listener);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowAddType(false);
        setOpenType(null);
        setAddingTagTo(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
    if (isOpen) { setShowAddType(false); setOpenType(null); setAddingTagTo(null); }
  };

  const handleTypeClick = (type) => {
    setOpenType(prev => (prev === type ? null : type));
    setAddingTagTo(null);
    setNewTagName('');
  };

  const handleTagToggle = (tag) => {
    const next = value.includes(tag)
      ? value.filter(t => t !== tag)
      : [...value, tag];
    onChange(next);
    // keep dropdown open for multi-select
  };

  const handleRemoveTag = (e, typeName, tag) => {
    e.stopPropagation();
    removeTagFromType(typeName, tag);
    // also deselect if it was selected
    if (value.includes(tag)) onChange(value.filter(t => t !== tag));
  };

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    if (tagGroups.find(g => g.type.toLowerCase() === trimmed.toLowerCase())) return;
    addCustomTagType(trimmed);
    setNewTypeName('');
    setShowAddType(false);
    setTimeout(() => { setOpenType(trimmed); setAddingTagTo(trimmed); }, 0);
  };

  const handleAddTag = (typeName) => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const group = tagGroups.find(g => g.type === typeName);
    if (!group || group.tags.includes(trimmed)) return;
    addTagToType(typeName, trimmed);
    setNewTagName('');
  };

  const handleDeleteType = (e, typeName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${typeName}" tag group?`)) return;
    // deselect any tags from this group
    const group = tagGroups.find(g => g.type === typeName);
    if (group) onChange(value.filter(t => !group.tags.includes(t)));
    deleteCustomTagType(typeName);
    if (openType === typeName) setOpenType(null);
  };

  const clearAll = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  // Trigger label
  const triggerLabel = value.length === 0
    ? 'Select Event Tags'
    : value.length <= 2
      ? value.join(', ')
      : `${value[0]}, ${value[1]} +${value.length - 2} more`;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── Trigger ── */}
      <div
        onClick={toggleDropdown}
        style={{
          ...inputStyle,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', borderColor: isOpen ? KM.teal : KM.border,
          userSelect: 'none', gap: 8,
        }}
      >
        <span style={{ color: value.length ? KM.text : KM.muted, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {triggerLabel}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {value.length > 0 && (
            <span
              onClick={clearAll}
              title="Clear all"
              style={{ fontSize: 11, color: KM.muted, cursor: 'pointer', lineHeight: 1, padding: '1px 3px', borderRadius: 3, background: '#F3F4F6' }}
            >✕</span>
          )}
          {value.length > 0 && (
            <span style={{ fontSize: 10, background: KM.orange, color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 700 }}>
              {value.length}
            </span>
          )}
          <span style={{ fontSize: 10, color: KM.muted }}>{isOpen ? '▴' : '▾'}</span>
        </div>
      </div>

      {/* ── Selected pills (below trigger) ── */}
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
          {value.map(tag => (
            <div key={tag} style={{
              display: 'flex', alignItems: 'center', gap: 3,
              background: KM.orangeLight, border: `1.5px solid ${KM.orange}`,
              borderRadius: 20, padding: '3px 8px 3px 10px',
            }}>
              <span style={{ fontSize: 11, color: KM.orange, fontWeight: 600 }}>{tag}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleTagToggle(tag); }}
                style={{ background: 'none', border: 'none', color: KM.orange, fontSize: 10, cursor: 'pointer', lineHeight: 1, padding: '0 1px', fontFamily: 'inherit' }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Dropdown ── */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 999,
          background: '#fff', border: `1px solid ${KM.border}`, borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 270, overflow: 'hidden',
        }}>

          {tagGroups.map(group => (
            <div key={group.type}>

              {/* Group header */}
              <div
                onClick={() => handleTypeClick(group.type)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px', cursor: 'pointer',
                  background: openType === group.type ? KM.orangeLight : '#fff',
                  borderBottom: `1px solid ${KM.border}`,
                  fontWeight: 600, fontSize: 13,
                  color: openType === group.type ? KM.orange : KM.text,
                  transition: 'background 0.15s',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {group.icon} {group.type}
                  {/* badge: how many from this group are selected */}
                  {(() => {
                    const count = group.tags.filter(t => value.includes(t)).length;
                    return count > 0 ? (
                      <span style={{ fontSize: 10, background: KM.orange, color: '#fff', borderRadius: 99, padding: '1px 6px', fontWeight: 700 }}>
                        {count}
                      </span>
                    ) : null;
                  })()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {group.custom && (
                    <span
                      onClick={(e) => handleDeleteType(e, group.type)}
                      title="Delete this group"
                      style={{ fontSize: 11, color: '#EF4444', fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: '#FEE2E2', lineHeight: 1.4, cursor: 'pointer' }}
                    >🗑</span>
                  )}
                  <span style={{ fontSize: 11, color: KM.muted }}>{openType === group.type ? '▴' : '▾'}</span>
                </div>
              </div>

              {/* Sub-tags panel */}
              {openType === group.type && (
                <div style={{ background: '#FAFAFA', borderBottom: `1px solid ${KM.border}`, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: group.tags.length ? 8 : 0 }}>
                    {group.tags.map(tag => {
                      const selected = value.includes(tag);
                      return (
                        <div key={tag} style={{
                          display: 'flex', alignItems: 'center', borderRadius: 20,
                          border: `1.5px solid ${selected ? KM.orange : KM.border}`,
                          background: selected ? KM.orange : '#fff', overflow: 'hidden',
                        }}>
                          <button
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            style={{ padding: '5px 10px', background: 'none', border: 'none', color: selected ? '#fff' : KM.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            {selected && <span style={{ marginRight: 4, fontSize: 10 }}>✓</span>}
                            {tag}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleRemoveTag(e, group.type, tag)}
                            style={{ padding: '4px 7px 4px 2px', background: 'none', border: 'none', color: selected ? 'rgba(255,255,255,0.8)' : '#EF4444', fontSize: 10, cursor: 'pointer', lineHeight: 1 }}
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>

                  {addingTagTo === group.type ? (
                    <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        placeholder="e.g. Farewell"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { e.preventDefault(); handleAddTag(group.type); }
                          if (e.key === 'Escape') { setAddingTagTo(null); setNewTagName(''); }
                        }}
                        style={{ ...inputStyle, flex: 1, padding: '5px 9px', fontSize: 12, borderColor: KM.green }}
                      />
                      <button type="button" onClick={() => handleAddTag(group.type)}
                        style={{ padding: '5px 10px', background: KM.green, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        + Add
                      </button>
                      <button type="button" onClick={() => { setAddingTagTo(null); setNewTagName(''); }}
                        style={{ padding: '5px 8px', background: 'none', border: `1px solid ${KM.border}`, borderRadius: 7, fontSize: 12, cursor: 'pointer', color: KM.muted, fontFamily: 'inherit' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setAddingTagTo(group.type); setNewTagName(''); }}
                      style={{ fontSize: 11, color: KM.green, fontWeight: 600, background: 'none', border: `1px dashed ${KM.green}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Add Tag
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* + Add New Group */}
          {!showAddType ? (
            <div
              onClick={(e) => { e.stopPropagation(); setShowAddType(true); setOpenType(null); setAddingTagTo(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: KM.teal, borderTop: `1px solid ${KM.border}`, background: '#F0FAFE' }}
            >
              <span style={{ fontSize: 15, lineHeight: 1 }}>＋</span> Add New Group
            </div>
          ) : (
            <div style={{ padding: '10px 12px', background: '#F0FAFE', borderTop: `1px solid ${KM.border}`, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                placeholder="e.g. Festival"
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddType(); }
                  if (e.key === 'Escape') setShowAddType(false);
                }}
                style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: 12, borderColor: KM.teal }}
              />
              <button type="button" onClick={handleAddType}
                style={{ padding: '6px 12px', background: KM.teal, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Add
              </button>
              <button type="button" onClick={() => { setShowAddType(false); setNewTypeName(''); }}
                style={{ padding: '6px 8px', background: 'none', color: KM.muted, border: `1px solid ${KM.border}`, borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}