import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

export const getHome = async (req, res) => {
  try {
    const userId = req.user.id;

    const accounts = await Account.find({ userId }).lean();
    if (!accounts || accounts.length === 0) {
      return res.status(404).render('home', { message: 'Аккаунты не найдены.' });
    }

    // Установите выбранный по умолчанию (первый)
    const selectedAccountId = req.session.selectedAccountId || accounts[0]._id;

    let transactions = await Transaction.find({ accountId: selectedAccountId })
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

    res.render('home', { accounts, transactions, selectedAccountId });
  } catch (error) {
    console.error('Ошибка при получении главной страницы:', error);
    res.status(500).render('home', { message: 'Ошибка при загрузке данных.' });
  }
};

// Новый метод для изменения выбранного аккаунта
export const changeAccount = (req, res) => {
  const { accountId } = req.params;
  
  // Сохраняем выбранный аккаунт в сессии
  req.session.selectedAccountId = accountId;
  
  return res.status(200).send('Аккаунт изменен');
};