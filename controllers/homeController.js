import Account from '../models/Account.js';

export const getHome = async (req, res) => {
  try {
      const userId = req.user.id;

      const accounts = await Account.find({ userId }).lean();
      if (!accounts || accounts.length === 0) {
          return res.status(404).render('home', { 
              message: 'У вас нет активных счетов.' 
          });
      }

      const selectedAccountId = req.session.selectedAccountId || accounts[0]._id;
      const selectedAccount = accounts.find(acc => 
          acc._id.toString() === selectedAccountId.toString()
      ) || accounts[0];

      res.render('home', { 
          accounts, 
          selectedAccountId,
          selectedAccount,
          formatDate: (date) => new Date(date).toLocaleDateString('ru-RU')
      });
  } catch (error) {
      console.error('Ошибка при получении главной страницы:', error);
      res.status(500).render('home', { 
          message: 'Ошибка при загрузке данных.' 
      });
  }
};

export const changeAccount = async (req, res) => {
  const { accountId } = req.params;
  
  try {
      const account = await Account.findById(accountId).lean();
      if (!account) {
          return res.status(404).json({ error: 'Счет не найден' });
      }

      req.session.selectedAccountId = accountId;
      
      return res.json({
          success: true,
          account: {
              balance: account.balance,
              currency: account.currency
          }
      });
  } catch (error) {
      console.error('Ошибка при смене счета:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};

export const getAccountBalance = async (req, res) => {
  try {
      const { accountId } = req.params;
      const account = await Account.findById(accountId).lean();
      
      if (!account) {
          return res.status(404).json({ error: 'Счет не найден' });
      }

      return res.json({
          balance: account.balance,
          currency: account.currency
      });
  } catch (error) {
      console.error('Ошибка при получении баланса:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
};