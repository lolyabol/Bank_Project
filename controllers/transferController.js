import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import axios from 'axios';

const exchangeRatesCache = {};
const COMMISSION_RATE = 0.01; 

export async function fetchExchangeRate(fromCurrency, toCurrency) {
  try {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    if (exchangeRatesCache[cacheKey]) {
      return exchangeRatesCache[cacheKey];
    }

    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const rate = response.data.rates[toCurrency];
    
    if (rate) {
      exchangeRatesCache[cacheKey] = rate;
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
        accounts: userAccounts,
        fromAccountCurrency: userAccounts[0].currency
      }
    });
  } catch (error) {
    console.error('Ошибка при загрузке страницы перевода:', error);
    res.status(500).render('error', { 
      message: 'Ошибка при загрузке страницы перевода' 
    });
  }
};

export const transferByPhone = async (req, res) => {
  console.log('Transfer by phone request:', {
    body: req.body,
    user: req.user
  });

  if (!req.user?.id) {
    console.error('User not authenticated');
    return res.status(401).json({ error: 'Не авторизован' });
  }

  const { fromAccountId, phoneNumber, amount } = req.body;
  const userId = req.user.id;

  if (!fromAccountId || !phoneNumber || !amount) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  const transferAmount = parseFloat(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'Некорректная сумма перевода' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fromAccount = await Account.findOne({
      _id: fromAccountId,
      userId: userId,
      status: 'active'
    }).session(session);

    if (!fromAccount) {
      throw new Error('Счёт отправителя не найден или недоступен');
    }

    const recipientUser = await User.findOne({
      phone: phoneNumber
    }).session(session);

    if (!recipientUser) {
      throw new Error('Пользователь с таким номером телефона не найден');
    }

    const toAccount = await Account.findOne({
      userId: recipientUser._id,
      status: 'active'
    }).session(session);

    if (!toAccount) {
      throw new Error('У получателя нет активного счёта');
    }

    if (fromAccount.balance < transferAmount) {
      throw new Error(`Недостаточно средств. Доступно: ${fromAccount.balance} ${fromAccount.currency}`);
    }

    let convertedAmount = transferAmount;
    let exchangeRate = 1;
    let commission = 0;

    if (fromAccount.currency !== toAccount.currency) {
      exchangeRate = await fetchExchangeRate(fromAccount.currency, toAccount.currency);
      convertedAmount = transferAmount * exchangeRate;
      commission = convertedAmount * COMMISSION_RATE;
      convertedAmount -= commission;
    }

    const transaction = new Transaction({
      userId: userId,
      fromAccount: fromAccount._id,
      toAccount: toAccount._id,
      amount: transferAmount,
      convertedAmount: fromAccount.currency !== toAccount.currency ? convertedAmount : undefined,
      currency: fromAccount.currency,
      targetCurrency: toAccount.currency,
      exchangeRate: fromAccount.currency !== toAccount.currency ? exchangeRate : undefined,
      commission: fromAccount.currency !== toAccount.currency ? commission : undefined,
      type: 'transfer',
      status: 'completed'
    });

    fromAccount.balance -= transferAmount;
    toAccount.balance += convertedAmount;

    await transaction.save({ session });
    await fromAccount.save({ session });
    await toAccount.save({ session });

    await session.commitTransaction();
    
    return res.status(200).json({ 
      success: true,
      message: `Перевод успешно выполнен. ${commission > 0 ? `Комиссия: ${commission.toFixed(2)} ${toAccount.currency}` : ''}`,
      fromAccount: {
        balance: fromAccount.balance,
        currency: fromAccount.currency
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Transfer error:', error);
    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
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