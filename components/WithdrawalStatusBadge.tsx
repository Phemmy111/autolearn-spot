import React from 'react';

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-800 text-yellow-200',
  APPROVED: 'bg-green-800 text-green-200',
  PROCESSING: 'bg-blue-800 text-blue-200',
  PAID: 'bg-green-900 text-green-100',
  REJECTED: 'bg-red-800 text-red-200',
  FAILED: 'bg-red-900 text-red-100',
};

interface WithdrawalStatusBadgeProps {
  status: string;
}

export const WithdrawalStatusBadge: React.FC<WithdrawalStatusBadgeProps> = ({ status }) => {
  const style = statusStyles[status] ?? 'bg-gray-700 text-gray-200';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
};

export default WithdrawalStatusBadge;
