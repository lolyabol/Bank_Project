function checkCalorieCalculator(req, res, next) {
    if (req.user && req.user.dailyCalorieIntake > 0) {
        return next(); 
    } else {
        return res.redirect('/main/calorieCalculator'); 
    }
}

export default checkCalorieCalculator;
