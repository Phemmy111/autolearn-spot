import React from 'react';
import { WithdrawalStatusBadge } from '@/components/WithdrawalStatusBadge';

interface TransactionRowProps {
  type: string;
  amount: number;
  date: string;
  status?: string;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({ type, amount, date, status }) => {
  const formattedAmount = amount >= 0 ? `+${amount}` : `-${Math.abs(amount)}`;
  const amountColor = amount >= 0 ? 'text-green-500' : 'text-red-500';
  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800 transition">
      <td className="px-4 py-2 whitespace-nowrap">{type.replace('_', ' ')}</td>
      <td className={`px-4 py-2 whitespace-nowrap ${amountColor}`}>{formattedAmount}</td>
      <td className="px-4 py-2 whitespace-nowrap">{new Date(date).toLocaleDateString()}</td>
      {status && (
        <td className="px-4 py-2 whitespace-nowrap">
          <WithdrawalStatusBadge status={status} />
        </td>
      )}
    </tr>
  );
};

export default TransactionRow;
