const expenseRepo = require('../repositories/expense.repository');
const HttpError = require('../utils/httpError');

async function createExpense(req, res) {
  const expense = await expenseRepo.create(req.body);
  res.status(201).json({ expense });
}

async function listExpenses(req, res) {
  const { category, vehicle_id, trip_id, from, to } = req.query;
  res.json({ expenses: await expenseRepo.list({ category, vehicle_id, trip_id, from, to }) });
}

async function getExpense(req, res) {
  const expense = await expenseRepo.findById(req.params.id);
  if (!expense) throw new HttpError(404, 'Expense not found');
  res.json({ expense });
}

async function deleteExpense(req, res) {
  const ok = await expenseRepo.remove(req.params.id);
  if (!ok) throw new HttpError(404, 'Expense not found');
  res.json({ message: 'Expense deleted' });
}

module.exports = { createExpense, listExpenses, getExpense, deleteExpense };
