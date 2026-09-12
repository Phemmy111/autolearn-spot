import React from 'react';

interface FinanceCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({ title, value, icon, footer }) => {
  return (
    <div className="rounded-2xl bg-gray-100] p-6 shadow-lg flex flex-col justify-between">
      <div className="flex items-center space-x-4">
        {icon && <div className="text-2xl text-primary-500">{icon}</div>}
        <h3 className="text-sm font-medium text-gray-300 uppercase">{title}</h3>
      </div>
      <p className="mt-4 text-3xl font-bold text-neutral-900">{value}</p>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};

export default FinanceCard;
