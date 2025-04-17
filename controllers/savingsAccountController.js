import SavingsAccount from '../models/SavingsAccount.js';

// Функция генерации уникального номера счета
const generateUniqueSavingsAccountNumber = async () => {
  let isUnique = false;
  let accountNumber;

  while (!isUnique) {
    accountNumber = '40802' + Math.floor(100000 + Math.random() * 900000);
    const existing = await SavingsAccount.findOne({ accountNumber });
    isUnique = !existing;
  }

  return accountNumber;
};

// Отобразить форму создания сберегательного счета
export const showCreateForm = (req, res) => {
  res.render('createSavingsAccount');
};

// Обработать создание сберегательного счета
export const createSavingsAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Проверяем, есть ли уже счет у пользователя
    const existing = await SavingsAccount.findOne({ userId });
    if (existing) {
      return res.status(400).send('Сберегательный счет уже существует');
    }

    const accountNumber = await generateUniqueSavingsAccountNumber();

    const newAccount = new SavingsAccount({
      userId,
      accountNumber,
      balance: 0,
      currency: 'RUB',
      status: 'active'
    });

    await newAccount.save();

    res.redirect('/main/savings-account'); // Перенаправляем на страницу просмотра счета
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при создании сберегательного счета');
  }
};

// Отобразить страницу с информацией о сберегательном счете
export const getSavingsAccountPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await SavingsAccount.findOne({ userId }).lean();

    if (!account) {
      return res.redirect('/main/savings-account/create'); // Если нет счета — перенаправляем на форму создания
    }

    res.render('savingsAccount', { account });
  } catch (error) {
    console.error(error);
    res.status(500).send('Ошибка при получении данных о сберегательном счете');
  }
};