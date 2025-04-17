// Получение страницы кредитов
export const getLoansPage = async (req, res) => {
    try {
        const loans = await Loan.find({ userId: req.user.id });
        
        res.render('loans'); // Передайте данные о кредитах в шаблон, если они есть.
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении данных о кредитах', error });
    }
};