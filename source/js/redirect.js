document.addEventListener('DOMContentLoaded', () => {
    const typing1 = document.getElementById('typing1');
    const typing2 = document.getElementById('typing2');
    const typing3 = document.getElementById('typing3');
    const typing4 = document.getElementById('typing4');
    const line2 = document.querySelector('.line2');
    const line3 = document.querySelector('.line3');
    const line4 = document.querySelector('.line4');

    typing1.style.animation = 'typing 2s steps(30, end) forwards';
    typing1.addEventListener('animationend', () => {
        typing1.classList.add('done');
        line2.style.display = 'flex';
        line2.classList.add('fade-in');

        typing2.style.animation = 'typing 3s steps(30, end) forwards';
        typing2.addEventListener('animationend', () => {
            typing2.classList.add('done');
            setTimeout(() => {
                line3.style.display = 'flex';
                line3.classList.add('fade-in');

                typing3.style.animation = 'typing 2s steps(30, end) forwards';
                typing3.addEventListener('animationend', () => {
                    typing3.classList.add('done');
                    setTimeout(() => {
                        line4.style.display = 'flex';
                        line4.classList.add('fade-in');

                        typing4.style.animation = 'typing 2s steps(30, end) forwards';
                        typing4.addEventListener('animationend', () => {
                            typing4.classList.add('done');
                        });
                    }, 500);
                });
            }, 500);
        });
    });
});
