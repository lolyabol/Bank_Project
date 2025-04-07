async function fetchUserMenu() {
    try {
        const response = await fetch('/menu/getMenu');
        if (!response.ok) {
            throw new Error('Ошибка при получении меню');
        }
        
        const data = await response.json();
        
        const menuContainer = document.getElementById('user-menu-container');
        menuContainer.innerHTML = ''; 

        if (data && data.menu && Array.isArray(data.menu.dishes)) {
            console.log('Меню пользователя:', data.menu.dishes);
            
            if (data.menu.dishes.length === 0) {
                menuContainer.innerHTML = '<p>Ой, Ваше меню пока пусто :(</p>';
                return;
            }

            for (const dish of data.menu.dishes) {
                if (!dish._id) { 
                    console.error('Dish ID is missing:', dish);
                    continue; 
                }

                console.log('Объект блюда перед вызовом populate:', dish); 

                const dishWithIngredients = await populate(dish); 
                if (dishWithIngredients) {
                    const menuItem = createDishCard(dishWithIngredients);
                    menuContainer.appendChild(menuItem);
                }
            }

            displayRemainingCalories(data.remainingCalories);

        } else {
            handleError('menu не является массивом или отсутствует:', data.menu);
        }
    } catch (error) {
        handleError('Ошибка при получении меню:', error);
    }
}


async function populate(dish) {
    if (!dish._id) {
        console.error('ID блюда отсутствует:', dish);
        return;
    }
    
    try {
        const response = await fetch(`/ingredients/getIngredients?dishId=${dish._id}`);
        if (!response.ok) {
            throw new Error('Ошибка при получении ингредиентов');
        }
        
        const ingredientsData = await response.json();
        console.log('Ингредиенты для блюда:', ingredientsData);
        
        if (ingredientsData && Array.isArray(ingredientsData.ingredients)) {
            return { ...dish, ingredientsList: ingredientsData.ingredients };
        } else {
            console.error('Неверная структура данных:', ingredientsData);
            return { ...dish, ingredientsList: [] }; 
        }
    } catch (error) {
        console.error('Ошибка при получении ингредиентов для блюда:', error);
        return { ...dish, ingredientsList: [] };
    }
}

function createDishCard(dish) {
    const menuItem = document.createElement('div');
    menuItem.className = 'dish-card';

    menuItem.innerHTML = `
        <img src="${dish.imageURL || 'default-image.jpg'}" alt="${dish.name || 'Блюдо'}" />
        <h3>${dish.name || 'Неизвестное блюдо'}</h3>
        
        <div class="dish-details" style="display: none;">
          <p>Калории: ${dish.calories || 'Не указано'}</p>
          <p>${dish.description || 'Описание отсутствует.'}</p>
          <h4>Рецепт:</h4>
          <p>${dish.recipe || 'Рецепт отсутствует.'}</p>
          <h4>Ингредиенты:</h4>
          <p>${Array.isArray(dish.ingredientsList) && dish.ingredientsList.length > 0 
              ? formatIngredients(dish.ingredientsList)
              : 'Ингредиенты отсутствуют.'}</p>
          <button class="remove-button" data-dish-id="${dish._id}">Удалить</button>
      </div>
    `;
    
    menuItem.addEventListener('click', () => {
      const details = menuItem.querySelector('.dish-details');
      details.style.display = details.style.display === 'none' ? 'block' : 'none';
    });

    const removeButton = menuItem.querySelector('.remove-button');
    removeButton.addEventListener('click', (event) => {
      event.stopPropagation(); 
      removeDishFromMenu(dish._id);
    });

    return menuItem;
}

function formatIngredients(ingredientsList) {
    const formattedIngredients = ingredientsList.map(item => {
        return `${item.quantity}г. ингредиента "${item.ingredientName}"`; 
    }).join('<br>');
    
    console.log('Отформатированные ингредиенты:', formattedIngredients);
    
    return formattedIngredients;
}


function handleError(message, error) {
   console.error(message, error);
   const menuContainer = document.getElementById('user-menu-container');
   menuContainer.innerHTML = '<p>Произошла ошибка при загрузке меню. Попробуйте позже.</p>';
}

async function removeDishFromMenu(dishId) {
   try {
       const response = await fetch(`/menu/removeDish/${dishId}`, { 
           method:'DELETE'
       });

       if (!response.ok) {
           throw new Error(`Ошибка при удалении блюда:${response.statusText}`);
       }

       fetchUserMenu();
       
       alert("Блюдо успешно удалено из меню!");
   } catch (error) {
       console.error("Ошибка:", error);
       alert("Не удалось удалить блюдо из меню.");
   }
}

function displayRemainingCalories(remainingCalories) {
   const remainingCaloriesDiv = document.getElementById('remaining-calories');
   remainingCaloriesDiv.innerHTML = `<h2>Осталось калорий до суточной нормы: ${remainingCalories} ккал</h2>`;
   
   const calorieWarning = document.getElementById('calorie-warning');
   if (remainingCalories < 0) { 
      calorieWarning.innerHTML ='Внимание! Вы превысили свою суточную норму калорий.';
   } else{
      calorieWarning.innerHTML=''; 
   }
}

document.addEventListener('DOMContentLoaded', fetchUserMenu);
