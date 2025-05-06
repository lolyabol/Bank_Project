import Account from '../models/Account.js';
import Transaction from '../models/Transaction.js';

export const getDepositPage = async (req, res) => {
    try {
        const userId = req.user.id;

        const accounts = await Account.find({ 
            userId,
            status: 'active' 
        }).lean();

        if (!accounts || accounts.length === 0) {
            return res.status(404).render('error', { 
                message: 'У вас нет активных счетов.' 
            });
        }

        const accountId = req.params.accountId || req.query.accountId || accounts[0]._id;

        const selectedAccount = accounts.find(acc => 
            acc._id.toString() === accountId.toString()
        ) || accounts[0];

        res.render('deposit', { 
            account: selectedAccount,
            accounts,
            user: res.locals.user
        });
    } catch (error) {
        console.error('Ошибка при загрузке страницы пополнения:', error);
        res.status(500).render('error', { 
            message: 'Ошибка при загрузке страницы пополнения.' 
        });
    }
};

export const postDeposit = async (req, res) => {
    try {
        const { accountId, amount } = req.body;
        const userId = req.user.id;

        const amountNumber = parseFloat(amount);
        if (isNaN(amountNumber) || amountNumber <= 0) {
            const data = await getAccountData(userId, accountId);
            return res.status(400).render('deposit', { 
                error: 'Сумма должна быть числом и больше нуля.',
                ...data
            });
        }

        const account = await Account.findOne({ _id: accountId, userId });
        
        if (!account || account.status !== 'active') {
            const data = await getAccountData(userId, accountId);
            return res.status(404).render('deposit', { 
                error: 'Счет не найден или не принадлежит вам.',
                ...data
            });
        }

        const transaction = new Transaction({
            userId,
            toAccount: account._id,
            amount: amountNumber,
            type: 'deposit',
            currency: account.currency,
            status: 'completed',
            fromAccount: null, 
            convertedAmount: amountNumber,
            targetCurrency: account.currency,
            exchangeRate: 1,
            commission: 0
        });

        const [updatedAccount] = await Promise.all([
            Account.findOneAndUpdate(
                { _id: accountId },
                { $inc: { balance: amountNumber } },
                { new: true }
            ),
            transaction.save()
        ]);

        if (!updatedAccount) {
            const data = await getAccountData(userId, accountId);
            return res.status(500).render('deposit', { 
                error: 'Не удалось обновить баланс счета.',
                ...data
            });
        }

        res.redirect('/main/home');
    } catch (error) {
        console.error('Ошибка при пополнении счета:', error);
        const data = await getAccountData(req.user.id, req.body.accountId);
        res.status(500).render('deposit', { 
            error: 'Ошибка при пополнении счета.',
            ...data
        });
    }
};

async function getAccountData(userId, accountId = null) {
    const accounts = await Account.find({ userId, status: 'active' }).lean();
    const account = accountId 
        ? accounts.find(a => a._id.toString() === accountId.toString())
        : accounts[0];
    
    return { accounts, account };
}