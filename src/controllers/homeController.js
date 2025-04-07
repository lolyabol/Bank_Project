export function HomePage(req, res) {
    const user = req.user; 
       res.render('home', { user }); 
}
