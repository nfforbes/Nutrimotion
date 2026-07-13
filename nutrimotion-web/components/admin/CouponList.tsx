'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import type { CouponDoc } from './AddCouponForm';

export interface CouponListProps {
  coupons: CouponDoc[];
  onEdit: (c: CouponDoc) => void;
  onDeactivate: (c: CouponDoc) => void;
  onSend: (c: CouponDoc) => void;
}

export default function CouponList({ coupons, onEdit, onDeactivate, onSend }: CouponListProps) {
  if (coupons.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 2 }}>
        No coupons yet. Create one to offer percentage or fixed discounts.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Code</TableCell>
            <TableCell>Value</TableCell>
            <TableCell>Expires</TableCell>
            <TableCell>Stackable</TableCell>
            <TableCell>One total (global)</TableCell>
            <TableCell>One per user</TableCell>
            <TableCell>Usage</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {coupons.map((c) => (
            <TableRow key={c._id}>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {c.code}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.description}
                </Typography>
              </TableCell>
              <TableCell>
                {c.type === 'percentage' ? `${c.value}%` : `$${Number(c.value).toFixed(2)}`}
              </TableCell>
              <TableCell>{new Date(c.validUntil).toLocaleString()}</TableCell>
              <TableCell>
                {c.stackable ? <Chip size="small" label="Yes" color="primary" variant="outlined" /> : 'No'}
              </TableCell>
              <TableCell>
                {c.usageLimit === 1 ? (
                  <Chip size="small" label="Yes" color="warning" variant="outlined" />
                ) : (
                  'No'
                )}
              </TableCell>
              <TableCell>{c.oneTimePerUser ? <Chip size="small" label="Yes" /> : 'No'}</TableCell>
              <TableCell>
                {c.usageCount ?? 0}
                {c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
              </TableCell>
              <TableCell>
                {c.active ? <Chip size="small" label="Active" color="success" /> : <Chip size="small" label="Inactive" />}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  size="small"
                  aria-label="Send to client"
                  onClick={() => onSend(c)}
                  disabled={!c.active}
                  title="Send to client"
                >
                  <SendIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Edit" onClick={() => onEdit(c)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="Deactivate"
                  onClick={() => onDeactivate(c)}
                  disabled={!c.active}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
