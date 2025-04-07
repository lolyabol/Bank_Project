document.addEventListener('DOMContentLoaded', function() {
    const menuButton = document.getElementById('menuButton');
    const menu = document.getElementById('menu');

    menuButton.addEventListener('click', function() {
        menu.classList.toggle('show');
    });
});
async function updateCalorieIntake(newCalories) {
    try {
        const response = await fetch('/updateCalorieIntake', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ calories: newCalories })
        });

        if (!response.ok) {
            throw new Error('Ошибка при обновлении нормы калорий');
        }

        const data = await response.json();
        alert(data.message);
        
        document.querySelector('.calorieNormP').innerText = `Ваша суточная норма калорий: ${newCalories} калорий`;
    } catch (error) {
        console.error(error);
        alert('Не удалось обновить норму калорий.');
    }
}
