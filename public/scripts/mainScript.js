// JavaScript для переключения между секциями
document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); // Отменяем стандартное поведение ссылки

            // Скрываем все секции
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });

            // Показываем выбранную секцию
            const target = this.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
        });
    });
});