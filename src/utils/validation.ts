// utils/validation.ts

export const isValidFullName = (name: string) =>
  name.trim().length > 2;

export const isValidIncome = (income: string) =>
  /^\d+(\.\d{1,2})?$/.test(income.trim());

export const isValidReason = (reason: string) =>
  reason.trim().length > 10;

export const isValidNoticeDate = (date: string) =>
  Boolean(date && !isNaN(Date.parse(date)));
