const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

const fallbackFoodImage = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80';
const foodImages = {
    'poha': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    'upma': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    'idli sambar': 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80',
    'masala dosa': 'https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=80',
    'aloo paratha': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=900&q=80',
    'veg biryani': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=80',
    'chole bhature': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
    'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    'veg burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    'french fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80',
    'veg sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80',
    'paneer roll': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=900&q=80',
    'maggi': 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=900&q=80',
    'paneer maggi': 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=900&q=80',
    'veg noodles': 'https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=900&q=80',
    'tea': 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=900&q=80',
    'coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    'cold coffee': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    'mango lassi': 'https://images.unsplash.com/photo-1553530666-ba11a90a0868?auto=format&fit=crop&w=900&q=80',
    'lemon juice': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=900&q=80',
    'gulab jamun': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    'vanilla ice cream': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=900&q=80',
};

document.querySelectorAll('[data-food-image]').forEach((image) => {
    const source = foodImages[image.dataset.foodName.toLowerCase()] || fallbackFoodImage;
    image.src = source;
    image.onerror = () => { image.onerror = null; image.src = fallbackFoodImage; };
});

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

const menuSearch = document.querySelector('#menu-search');
const mealButtons = document.querySelectorAll('[data-meal]');
const vegetarianFilter = document.querySelector('#vegetarian-filter');
const availableFilter = document.querySelector('#available-filter');
const maxPriceFilter = document.querySelector('#max-price');
const menuCards = document.querySelectorAll('[data-menu-card]');
const resultCount = document.querySelector('#menu-result-count');
const noResults = document.querySelector('#no-menu-results');
let activeMeal = 'all';

function filterMenu() {
    if (!menuCards.length) return;

    const searchTerm = menuSearch.value.trim().toLowerCase();
    const maximumPrice = Number(maxPriceFilter.value);
    let visibleCount = 0;

    menuCards.forEach((card) => {
        const searchableText = `${card.dataset.name} ${card.dataset.category} ${card.dataset.tags}`;
        const matchesSearch = searchableText.includes(searchTerm);
        const matchesMeal = activeMeal === 'all'
            || (activeMeal === 'beverages' && card.dataset.category === 'beverages')
            || card.dataset.mealType === activeMeal;
        const matchesVegetarian = !vegetarianFilter.checked || card.dataset.vegetarian === 'true';
        const matchesAvailability = !availableFilter.checked || card.dataset.available === 'true';
        const matchesPrice = !maxPriceFilter.value || Number(card.dataset.price) <= maximumPrice;
        const shouldShow = matchesSearch && matchesMeal && matchesVegetarian && matchesAvailability && matchesPrice;

        card.hidden = !shouldShow;
        const gridColumn = card.closest('.col-lg-3');
        if (gridColumn) gridColumn.hidden = !shouldShow;
        if (shouldShow) visibleCount += 1;
    });

    resultCount.textContent = `${visibleCount} item${visibleCount === 1 ? '' : 's'} found`;
    noResults.hidden = visibleCount !== 0;
}

if (menuSearch && vegetarianFilter && availableFilter && maxPriceFilter) {
    menuSearch.addEventListener('input', filterMenu);
    vegetarianFilter.addEventListener('change', filterMenu);
    availableFilter.addEventListener('change', filterMenu);
    maxPriceFilter.addEventListener('input', filterMenu);

    mealButtons.forEach((button) => {
        button.addEventListener('click', () => {
            activeMeal = button.dataset.meal;
            mealButtons.forEach((mealButton) => {
                const isActive = mealButton === button;
                mealButton.classList.toggle('is-active', isActive);
                mealButton.setAttribute('aria-pressed', isActive);
            });
            filterMenu();
        });
    });

    filterMenu();
}
