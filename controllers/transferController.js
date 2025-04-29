import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import axios from 'axios';

const exchangeRatesCache = {};

async function fetchExchangeRate(fromCurrency, toCurrency) {
  try {
    if (exchangeRatesCache[`${fromCurrency}_${toCurrency}`]) {
      return exchangeRatesCache[`${fromCurrency}_${toCurrency}`];
    }

    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const rate = response.data.rates[toCurrency];
    
    if (rate) {
      exchangeRatesCache[`${fromCurrency}_${toCurrency}`] = rate;
      return rate;
    }
    throw new Error('Курс валюты не найден');
  } catch (error) {
    console.error('Ошибка при получении курса валют:', error);
    throw new Error('Не удалось получить курс валют');
  }
}

export const getTransferPage = async (req, res) => {
  try {
    const userAccounts = await Account.find({ 
      userId: req.user.id, 
      status: 'active' 
    }).lean();

    if (!userAccounts.length) {
      return res.status(400).render('error', { 
        message: 'У вас нет активных счетов для перевода' 
      });
    }

    res.render('transfer', { 
      user: {
        ...req.user,
        accounts: userAccounts
      }
    });
  } catch (error) {
    console.error('Ошибка при загрузке страницы перевода:', error);
    res.status(500).render('error', { 
      message: 'Ошибка при загрузке страницы перевода' 
    });
  }
};

export const transferBetweenAccounts = async (req, res) => {
  const { fromAccountId, recipientIdentifier, amount } = req.body;
  const userId = req.user.id;

  try {
    if (!fromAccountId || !recipientIdentifier || !amount) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    const transferAmount = parseFloat(amount);
    
    // Проверка на валидность суммы
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Сумма должна быть числом и больше нуля' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Поиск счета отправителя
      const fromAccount = await Account.findOne({
        _id: fromAccountId,
        userId: userId,
        status: 'active'
      }).session(session);

      if (!fromAccount) {
        throw new Error('Счет отправителя не найден или недоступен');
      }

      // Проверка баланса
      if (fromAccount.balance < transferAmount) {
        console.error(`Недостаточно средств: требуется ${transferAmount}, доступно ${fromAccount.balance}`);
        throw new Error(`Недостаточно средств. Доступно: ${fromAccount.balance} ${fromAccount.currency}`);
      }

      // Поиск счета получателя
      let toAccount = await Account.findOne({
        $or: [
          { accountNumber: recipientIdentifier },
          { _id: recipientIdentifier }
        ],
        status: 'active'
      }).session(session);

      // Если счет получателя не найден, ищем пользователя по номеру телефона
      if (!toAccount) {
        const recipientUser = await User.findOne({
          phone: recipientIdentifier
        }).session(session);

        if (!recipientUser) {
          throw new Error('Получатель не найден');
        }

        toAccount = await Account.findOne({
          userId: recipientUser._id,
          isMain: true,
          status: 'active'
        }).session(session);

        if (!toAccount) {
          throw new Error('Основной счет получателя не найден');
        }
      }

      let convertedAmount = transferAmount;
      let exchangeRate = 1;

      // Если валюты разные, получаем курс обмена
      if (fromAccount.currency !== toAccount.currency) {
        exchangeRate = await fetchExchangeRate(fromAccount.currency, toAccount.currency);
        convertedAmount = parseFloat((transferAmount * exchangeRate).toFixed(2));
      }

      // Обновляем балансы счетов
      fromAccount.balance -= transferAmount;
      toAccount.balance += convertedAmount;

      await fromAccount.save({ session });
      await toAccount.save({ session });

      // Создаем транзакции
      const debitTransaction = new Transaction({
        userId: fromAccount.userId,
        fromAccount: fromAccount._id,
        toAccount: toAccount._id,
        amount: transferAmount,
        convertedAmount: fromAccount.currency !== toAccount.currency ? convertedAmount : undefined,
        type: 'Перевод отправлен',
        currency: fromAccount.currency,
        targetCurrency: toAccount.currency,
        exchangeRate: fromAccount.currency !== toAccount.currency ? exchangeRate : undefined,
        date: new Date()
      });

      const creditTransaction = new Transaction({
        userId: toAccount.userId,
        fromAccount: fromAccount._id,
        toAccount: toAccount._id,
        amount: convertedAmount,
        originalAmount: fromAccount.currency !== toAccount.currency ? transferAmount : undefined,
        type: 'Перевод получен',
        currency: toAccount.currency,
        sourceCurrency: fromAccount.currency,
        exchangeRate: fromAccount.currency !== toAccount.currency ? exchangeRate : undefined,
        date: new Date()
      });

      await debitTransaction.save({ session });
      await creditTransaction.save({ session });

      await session.commitTransaction();

      return res.status(200).json({ 
        success: true,
        message: `Перевод успешно выполнен. Сумма получателю: ${convertedAmount} ${toAccount.currency}`,
        fromAccountBalanceAfterTransfer: fromAccount.balance
      });

    } catch (error) {
      await session.abortTransaction();
      
       // Логируем ошибку с более подробной информацией
       console.error('Ошибка при переводе:', error.message);
       return res.status(400).json({ error: error.message });
       
     } finally {
       session.endSession();
     }

   } catch (error) {
     console.error('Ошибка при обработке перевода:', error);
     return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
   }
};

export const getAccountInfo = async (req, res) => {
  try {
    const { identifier } = req.query;

    let account = await Account.findOne({
       accountNumber : identifier ,
       status : 'active'
     }).lean();

     if (!account){
       const user = await User.findOne({ phone : identifier });
       if (user) {
         account = await Account.findOne({
           userId:user._id ,
           isMain:true ,
           status:'active'
         }).lean();
       }
     }

     if (!account){
       return res.status(404).json({error:'Счет не найден'});
     }

     res.json({
       currency : account.currency ,
       accountNumber : account.accountNumber
     });
   } catch(error){
     console.error('Ошибка при получении информации о счете:', error);
     res.status(500).json({error:'Внутренняя ошибка сервера'});
   }
};

export const getExchangeRateHandler = async (req, res) => { 
   try{
     const {from , to} = req.query;
     const rate=await fetchExchangeRate(from , to); 
     res.json({rate});
   } catch(error){
     console.error('Ошибка при получении курса валют:', error);
     res.status(500).json({error:'Не удалось получить курс валют'});
   }
};