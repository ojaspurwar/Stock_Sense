import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';

export const ProfileScreen: React.FC = () => {
  const { user, switchRole, logout } = useAuth();

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AK';

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd || newPwd !== confirmPwd) {
      setToastMsg('Passwords do not match.');
      return;
    }
    setToastMsg('Password changed successfully.');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  return (
    <div className="list" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="list-head">
        <h1>My profile</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <span
          className="av"
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--sky-50)',
            color: 'var(--sky-700)',
            border: '2px solid var(--sky-100)',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          {initials}
        </span>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 500 }}>{user?.name || 'Arjun Kapoor'}</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{user?.email || 'arjun@kapoorsteel.in'}</p>
        </div>
      </div>

      <div className="group" style={{ marginBottom: 24 }}>
        <h3>Account role</h3>
        <p className="note">
          Switch between roles to test permission states and views.
        </p>
        <div className="seg2" style={{ maxWidth: 360, marginTop: 8 }}>
          <span
            className={user?.role === 'MANAGER' ? 'on' : ''}
            onClick={() => switchRole('MANAGER')}
          >
            Inventory manager
          </span>
          <span
            className={user?.role === 'STAFF' ? 'on' : ''}
            onClick={() => switchRole('STAFF')}
          >
            Warehouse staff
          </span>
        </div>
      </div>

      <div className="group">
        <h3>Change password</h3>
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
          <Input
            label="Current password"
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
          <div className="two">
            <Input
              label="New password"
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variant="danger" type="button" onClick={logout}>
              Log out
            </Button>
            <Button variant="primary" type="submit">
              Save password
            </Button>
          </div>
        </form>
      </div>

      <Toast message={toastMsg} onDismiss={() => setToastMsg(null)} />
    </div>
  );
};
