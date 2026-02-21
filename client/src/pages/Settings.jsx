import { useState, useEffect } from 'react';
import { useAuthStore } from '../store';
import { User, Lock, Palette, Save, Loader2 } from 'lucide-react';

const COLORS = [
  { name: 'Purple', value: '#9b7cff' },
  { name: 'Green', value: '#39e97b' },
  { name: 'Orange', value: '#ff7c3a' },
  { name: 'Blue', value: '#3acdff' },
  { name: 'Pink', value: '#f472b6' },
  { name: 'Yellow', value: '#ffcc00' },
];

export default function Settings() {
  const { user, updateProfile } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [brandColor, setBrandColor] = useState(() => {
    return localStorage.getItem('brandColor') || '#9b7cff';
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-color', brandColor);
    localStorage.setItem('brandColor', brandColor);
  }, [brandColor]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.target);
      await updateProfile({
        name: formData.get('name'),
        phone: formData.get('phone'),
      });
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="text-muted-2 text-sm">Manage your account and preferences</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-danger/10 text-danger' : 'bg-accent-green/10 text-accent-green'}`}>
          {message}
        </div>
      )}

      {/* Profile */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-bold flex items-center gap-2">
            <User size={18} /> Profile
          </h2>
        </div>
        <form onSubmit={handleSaveProfile} className="p-4 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Name</label>
              <input name="name" defaultValue={user?.name} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Email</label>
              <input value={user?.email} disabled className="input w-full bg-background-2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Phone</label>
            <input name="phone" defaultValue={user?.phone} className="input w-full" />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase text-muted-2 mb-1">Role</label>
            <div className="input w-full bg-background-2 capitalize">{user?.role}</div>
          </div>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-bold flex items-center gap-2">
            <Palette size={18} /> Appearance
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-muted-2 mb-2">Brand Color</label>
            <div className="flex gap-3">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setBrandColor(color.value)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    brandColor === color.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-xs text-muted-2 mt-2">
              Current: <span style={{ color: brandColor }}>{brandColor}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-bold flex items-center gap-2">
            <Lock size={18} /> Security
          </h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-2 mb-4">Change your password</p>
          <button className="btn btn-ghost">Change Password</button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <div className="p-4 border-b border-border">
          <h2 className="font-heading font-bold">About</h2>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-2">Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-2">Build</span>
            <span className="font-mono">2024.01</span>
          </div>
        </div>
      </div>
    </div>
  );
}
