export const AboutPage = (req, res) => {
    const user = req.user; 
       res.render('about', { user });
};

