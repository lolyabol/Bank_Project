import mongoose from 'mongoose';
import Ingredient from '../models/Ingredient.js'; 

mongoose.connect('mongodb://localhost:27017/MenuProjectDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to the database');

    Ingredient.find()
        .then(ingredients => {
            console.log('Ингредиенты в базе данных:', ingredients);
        })
        .catch(err => {
            console.error('Ошибка при получении ингредиентов:', err);
        })
        .finally(() => {
            mongoose.connection.close(); 
        });
})
.catch(err => {
    console.error('Ошибка подключения к базе данных:', err);
});
