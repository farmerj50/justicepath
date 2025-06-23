import React from 'react';
import classNames from 'classnames';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...rest }) => {
  return (
    <div className={classNames("rounded-lg bg-gray-900 shadow p-4", className)} {...rest}>
      {children}
    </div>
  );
};
