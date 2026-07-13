'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import AddCouponForm, { CouponDoc } from '@/components/admin/AddCouponForm';
import CouponList from '@/components/admin/CouponList';
import SendCouponDialog from '@/components/admin/SendCouponDialog';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import axios from 'axios';

export default function AdminCouponsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CouponDoc | null>(null);
  const [coupons, setCoupons] = useState<CouponDoc[]>([]);
  const [sendingCoupon, setSendingCoupon] = useState<CouponDoc | null>(null);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get<CouponDoc[]>('/api/admin/coupons');
      setCoupons(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setCoupons([]);
    }
  };

  const handleDeactivate = async (c: CouponDoc) => {
    if (!window.confirm(`Deactivate coupon "${c.code}"? It will no longer apply at checkout.`)) return;
    try {
      await axios.delete(`/api/admin/coupons/${c._id}`);
      await fetchCoupons();
    } catch (e) {
      console.error(e);
      window.alert('Failed to deactivate coupon.');
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Coupons</Typography>
          {!showForm && !editing && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
              New Coupon
            </Button>
          )}
        </Box>

        {showForm || editing ? (
          <AddCouponForm
            initialCoupon={editing}
            onSuccess={() => {
              setShowForm(false);
              setEditing(null);
              fetchCoupons();
            }}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        ) : (
          <CouponList
            coupons={coupons}
            onEdit={(c) => setEditing(c)}
            onDeactivate={handleDeactivate}
            onSend={(c) => setSendingCoupon(c)}
          />
        )}

        <SendCouponDialog
          coupon={sendingCoupon}
          open={!!sendingCoupon}
          onClose={() => setSendingCoupon(null)}
        />
      </Container>
    </>
  );
}
