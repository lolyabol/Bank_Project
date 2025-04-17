import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import SavingsAccount from '../models/SavingsAccount.js';

export const getHome = async (req, res) => {
  try {
    const userId = req.user.id;

    // Получаем основной счет пользователя
    const account = await Account.findOne({ userId }).lean();
    if (!account) {
      return res.status(404).render('home', { message: 'Аккаунт не найден.' });
    }

    // Получаем транзакции по основному счету
    let transactions = await Transaction.find({ accountId: account._id })
      .sort({ date: -1 })
      .lean();

    // Форматируем дату для каждой транзакции
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

    // Получаем сберегательный счет пользователя (если есть)
    const savingsAccount = await SavingsAccount.findOne({ userId }).lean();

    // Формируем объект для передачи в шаблон
    const accountData = {
      balance: account.balance,
      savingsBalance: savingsAccount ? savingsAccount.balance : null,
      // можно добавить другие поля, если нужно
    };

    res.render('home', { account: accountData, transactions });
  } catch (error) {
    console.error('Ошибка при получении главной страницы:', error);
    res.status(500).render('home', { message: 'Ошибка при загрузке данных.' });
  }
};