document.getElementById("calculateCalories").addEventListener("click", async function() {
    const weight = parseFloat(document.getElementById("weightInput").value);
    const height = parseFloat(document.getElementById("heightInput").value);
    const age = parseInt(document.getElementById("ageInput").value);
    const gender = document.getElementById("gender").value;
    const activityLevel = parseFloat(document.getElementById("activityLevel").value);
    const goal = document.getElementById("goal").value;

    if (!weight || !height || !age || !gender || !activityLevel || !goal) {
        alert("Пожалуйста, заполните все поля.");
        return;
    }

    let bmr;

    if (gender === "male") {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    let calories = bmr * activityLevel;

    if (goal === "lose") {
        calories -= 500; 
    } else if (goal === "gain") {
        calories += 500; 
    }

    const weeklyCalories = Math.round(calories * 7);

    try {
        const response = await fetch('/updateCalorieIntake', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ calories: Math.round(calories) })
        });

        if (!response.ok) throw new Error('Ошибка при обновлении данных');

        document.getElementById("calorieResult").innerHTML = 
    `Ваша суточная норма калорий: ${Math.round(calories)} калорий.<br>Ваша недельная норма калорий: ${weeklyCalories} калорий.`;

    } catch (error) {
        console.error("Ошибка:", error);
        alert("Не удалось сохранить данные.");
    }
});