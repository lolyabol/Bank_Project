document.addEventListener('DOMContentLoaded', () => {
    // Обновление баланса в меню
    async function updateBalance() {
        try {
            const response = await fetch('/api/bank/balance');
            const data = await response.json();
            document.getElementById('currentBalance').textContent = data.balance;
        } catch (error) {
            console.error('Ошибка обновления баланса:', error);
        }
    }

    // Обработка перевода
    document.getElementById('transferForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            recipientAccount: document.getElementById('recipientAccount').value,
            amount: document.getElementById('amount').value,
            comment: document.getElementById('comment').value
        };

        try {
            const response = await fetch('/main/bank/transfer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (result.success) {
                alert('Перевод выполнен успешно!');
                updateBalance();
                location.reload(); // Обновим страницу для показа новой транзакции
            } else {
                alert(`Ошибка: ${result.error}`);
            }
        } catch (error) {
            console.error('Ошибка перевода:', error);
            alert('Ошибка при выполнении перевода');
        }
    });

    // Обработка кредита
    document.getElementById('loanForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            amount: document.getElementById('loanAmount').value,
            term: document.getElementById('loanTerm').value
        };

        try {
            const response = await fetch('/main/bank/loan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            if (result.success) {
                alert('Заявка на кредит отправлена!');
                updateBalance();
            } else {
                alert(`Ошибка: ${result.error}`);
            }
        } catch (error) {
            console.error('Ошибка кредита:', error);
            alert('Ошибка при оформлении кредита');
        }
    });
});