interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
  // Application statuses
  pending: 'badge--orange',
  under_review: 'badge--blue',
  approved: 'badge--green',
  rejected: 'badge--red',
  requires_revision: 'badge--purple',
  // Franchise statuses
  active: 'badge--green',
  expired: 'badge--red',
  suspended: 'badge--orange',
  // Payment statuses
  completed: 'badge--green',
  failed: 'badge--red',
  // Driver statuses
  inactive: 'badge--gray',
  // Feedback statuses
  reviewed: 'badge--blue',
  resolved: 'badge--green',
  // Document statuses
  uploaded: 'badge--orange',
  verified: 'badge--green',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_revision: 'Needs Revision',
  active: 'Active',
  expired: 'Expired',
  suspended: 'Suspended',
  completed: 'Completed',
  failed: 'Failed',
  inactive: 'Inactive',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
  uploaded: 'Uploaded',
  verified: 'Verified',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colorClass = statusColors[status] || 'badge--gray';
  const label = statusLabels[status] || status;

  return (
    <span className={`badge ${colorClass} badge--${size}`}>
      {label}
    </span>
  );
}
