export interface ExpenseFilter {
  dateRange: { from?: Date; to?: Date };
}

export const emptyExpenseFilter: ExpenseFilter = {
  dateRange: {},
};
