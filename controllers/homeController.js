import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import SavingsAccount from '../models/SavingsAccount.js';

export const getHome = async (req, res) => {
  try {
    const userId = req.user.id;

    const account = await Account.findOne({ userId }).lean();
    if (!account) {
      return res.status(404).render('home', { message: 'Аккаунт не найден.' });
    }

    let transactions = await Transaction.find({ accountId: account._id })
      .sort({ date: -1 })
      .lean();
    transactions = transactions.map(tx => ({
      ...tx,
      formattedDate: tx.date ? new Date(tx.date).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '',
    }));

    const savingsAccount = await SavingsAccount.findOne({ userId }).lean();

    const accountData = {
      balance: account.balance,
      savingsBalance: savingsAccount ? savingsAccount.balance : null,
    };

    res.render('home', { account: accountData, transactions });
  } catch (error) {
    console.error('Ошибка при получении главной страницы:', error);
    res.status(500).render('home', { message: 'Ошибка при загрузке данных.' });
  }
};