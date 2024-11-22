const apiKey = '4a2f11c859d54cea9a3110639241711';

let weatherDataCache = null; // Cache the weather data

// DOM Element for the Favorites section
const favoritesContainer = document.querySelector('.favorites-container');

// Get the saved preference for hiding/showing the Favorites section
let isFavoritesHidden = JSON.parse(localStorage.getItem('hideFavorites')) || false;

// Function to toggle visibility of the Favorites section
function toggleFavoritesVisibility() {
    isFavoritesHidden = !isFavoritesHidden;
    localStorage.setItem('hideFavorites', JSON.stringify(isFavoritesHidden));
    updateFavoritesVisibility();
}

// Function to update the visibility of the Favorites section
function updateFavoritesVisibility() {
    if (isFavoritesHidden) {
        favoritesContainer.style.display = 'none';
    } else {
        favoritesContainer.style.display = 'block';
    }
}

// Event Listener for the toggle in the options menu
const hideFavoritesCheckbox = document.getElementById('hide-favorites-checkbox');
hideFavoritesCheckbox.addEventListener('change', toggleFavoritesVisibility);

// Initial setup: Apply the user's saved preference on page load
window.addEventListener('load', () => {
    hideFavoritesCheckbox.checked = isFavoritesHidden;
    updateFavoritesVisibility();
});

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const currentLocationBtn = document.getElementById('current-location');
const themeToggle = document.querySelector('.theme-toggle');
const errorMessage = document.getElementById('error-message');

// Theme Toggle
function toggleTheme() {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    themeToggle.innerHTML = document.body.dataset.theme === 'dark' ? 
        '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

themeToggle.addEventListener('click', toggleTheme);

// Get references to favorites elements
const favoritesList = document.getElementById('favorites-list');
const addFavoriteBtn = document.getElementById('add-favorite-btn');

// Load favorites from localStorage
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Function to render favorites list
function renderFavorites() {
    favoritesList.innerHTML = ''; // Clear the list

    if (favorites.length === 0) {
        const noFavoritesMessage = document.createElement('p');
        noFavoritesMessage.className = 'no-favorites-message';
        noFavoritesMessage.textContent = 'No favorites yet. Add your favorite locations!';
        favoritesList.appendChild(noFavoritesMessage);
    } else {
        favorites.forEach((location, index) => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.textContent = location;

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-times"></i>'; // Use an icon for the remove button
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFavorite(index);
            });

            item.appendChild(removeBtn);
            item.addEventListener('click', () => fetchWeather(location)); // Fetch weather when clicked
            favoritesList.appendChild(item);
        });
    }
}

// Function to add a favorite
function addFavorite(location) {
    if (!favorites.includes(location)) {
        favorites.push(location);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    } else {
        alert(`${location} is already in your favorites!`);
    }
}

// Function to remove a favorite
function removeFavorite(index) {
    favorites.splice(index, 1);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

// Add current location to favorites
addFavoriteBtn.addEventListener('click', () => {
    const currentCity = document.getElementById('city').textContent;
    if (currentCity) {
        addFavorite(currentCity);
    } else {
        alert('No city selected to save!');
    }
});

// Initial render of favorites
renderFavorites();

// Update DateTime
function updateDateTime() {
    const dateTime = document.getElementById('date-time');
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    dateTime.textContent = now.toLocaleDateString('en-US', options);
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

// Convert Fahrenheit to Celsius
function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * 5/9;
}

// Fetch Weather Data
async function fetchWeather(city) {
    try {
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=14&aqi=yes`
        );

        if (!response.ok) throw new Error('City not found');

        const data = await response.json();
        weatherDataCache = data; // Store the fetched data

        // Extract coordinates
        const long = data.location.lon;
        const lat = data.location.lat;

        console.log(`Coordinates for ${city}: Longitude - ${long}, Latitude - ${lat}`);

        // Update UI and charts with fetched data
        updateWeatherUI(data);
        updateForecastChart(lat, long);
        updateHourlyForecastChart(data);
        errorMessage.style.display = 'none';
    } catch (error) {
        errorMessage.textContent = 'City not found. Please try again.';
        errorMessage.style.display = 'block';
    }
}

// Settings Modal
const settingsToggle = document.querySelector('.settings-toggle');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.querySelector('.close-settings');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
const unitToggle = document.getElementById('unit-toggle');

// Load saved preferences
let currentUnit = localStorage.getItem('tempUnit') || 'C';
unitToggle.checked = currentUnit === 'F';

// Settings Modal Controls
settingsToggle.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

closeSettings.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.style.display = 'none';
    }
});

// Tab Controls
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

unitToggle.addEventListener('change', () => {
    currentUnit = unitToggle.checked ? 'F' : 'C';
    localStorage.setItem('tempUnit', currentUnit);

    // Update the temperature display if weather data is available
    const currentTemp = document.getElementById('temp');
    const feelsLikeTemp = document.getElementById('feels-like');

    if (currentTemp.textContent) {
        const tempValue = parseFloat(currentTemp.textContent);
        const feelsLikeValue = parseFloat(feelsLikeTemp.textContent);

        if (currentUnit === 'F') {
            currentTemp.textContent = Math.round((tempValue * 9/5) + 32);
            feelsLikeTemp.textContent = `${Math.round((feelsLikeValue * 9/5) + 32)}°${currentUnit}`;
        } else {
            currentTemp.textContent = Math.round((tempValue - 32) * 5/9);
            feelsLikeTemp.textContent = `${Math.round((feelsLikeValue - 32) * 5/9)}°${currentUnit}`;
        }

        document.getElementById('temp-unit').textContent = `°${currentUnit}`;
    }

    // Re-fetch weather data and update the graphs
    if (weatherDataCache) {
        updateWeatherUI(weatherDataCache);
        updateForecastChart(weatherDataCache.location.lat, weatherDataCache.location.lon);
        updateHourlyForecastChart(weatherDataCache);
    }
});


function updateWeatherUI(data) {
    const temp = currentUnit === 'C' ? data.current.temp_c : data.current.temp_f;
    const feelsLike = currentUnit === 'C' ? data.current.feelslike_c : data.current.feelslike_f;
    
    document.getElementById('city').textContent = data.location.name;
    document.getElementById('country').textContent = `${data.location.region}, ${data.location.country}`;
    document.getElementById('temp').textContent = Math.round(temp);
    document.getElementById('temp-unit').textContent = `°${currentUnit}`; // Update unit here
    document.getElementById('weather-desc').textContent = data.current.condition.text;
    document.getElementById('weather-icon').src = data.current.condition.icon;
    document.getElementById('feels-like').textContent = `${Math.round(feelsLike)}°${currentUnit}`; // Update unit here
    document.getElementById('humidity').textContent = `${data.current.humidity}%`;
    document.getElementById('wind-speed').textContent = `${data.current.wind_kph} km/h`;
    document.getElementById('wind-dir').textContent = data.current.wind_dir;

    updateDateTime();
}

function updateHourlyForecastChart(data) {
    const hours = data.forecast.forecastday[0].hour;
    const currentHour = new Date().getHours();

    // Get next 24 hours of data, starting from current hour
    const hourlyData = [...hours.slice(currentHour), ...hours.slice(0, currentHour)].slice(0, 24);

    const labels = hourlyData.map(hour => {
        const date = new Date(hour.time);
        return date.toLocaleTimeString('en-US', { hour: 'numeric' });
    });

    const temperatures = hourlyData.map(hour => {
        const temp = currentUnit === 'F' ? celsiusToFahrenheit(hour.temp_c) : hour.temp_c;
        return temp; // Convert if unit is Fahrenheit
    });
    

    const precipitation = hourlyData.map(hour => hour.precip_mm);
    const snow = hourlyData.map(hour => hour.snow_cm || 0);

    const ctx = document.getElementById('hourlyForecastChart').getContext('2d');

    if (window.hourlyChart instanceof Chart) {
        window.hourlyChart.destroy();
    }

    window.hourlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: `Temperature (°${currentUnit})`, // Dynamic unit
                    data: temperatures,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y-temperature'
                },
                {
                    label: 'Rain (mm)',
                    data: precipitation,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y-precipitation'
                },
                {
                    label: 'Snow (cm)',
                    data: snow,
                    backgroundColor: 'rgba(56, 00, 33, 0.2)',
                    borderColor: 'rgba(59, 48, 53, 1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y-precipitation'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                'y-temperature': {
                    type: 'linear',
                    position: 'left',
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    title: {
                        display: true,
                        text: `Temperature (°${currentUnit})` // Dynamic unit
                    }
                },
                'y-precipitation': {
                    type: 'linear',
                    position: 'right',
                    grid: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Rain (mm) / Snow (cm)'
                    },
                    min: 0,
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value < 0) return null;
                            return value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            }
        }
    });
}

function updateForecastChart(latitude, longitude) {
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=auto&forecast_days=14`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(weatherData => {
            const forecastData = weatherData.daily;

            const dates = forecastData.time.map(date =>
                new Date(date).toLocaleDateString('en-US', { day: 'numeric', weekday: 'short' })
            );

            const temperatures = forecastData.temperature_2m_max.map((max, index) => {
                const min = forecastData.temperature_2m_min[index];
                const avg = (max + min) / 2;
                return currentUnit === 'F' ? celsiusToFahrenheit(avg) : avg; // Convert if unit is Fahrenheit
            });
            

            const rainfall = forecastData.precipitation_sum;
            const snowfall = forecastData.snowfall_sum;

            const ctx = document.getElementById('forecastChart').getContext('2d');

            if (window.forecastChart instanceof Chart) {
                window.forecastChart.destroy();
            }

            window.forecastChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: dates,
                    datasets: [
                        {
                            label: 'Temperature (°' + currentUnit + ')', // Dynamic unit
                            data: temperatures,
                            type: 'line',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            yAxisID: 'y-axis-temperature'
                        },
                        {
                            label: 'Rainfall (mm)',
                            data: rainfall,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            yAxisID: 'y-axis-rainfall'
                        },
                        {
                            label: 'Snow (cm)',
                            data: snowfall,
                            backgroundColor: 'rgba(56, 00, 33, 0.2)',
                            borderColor: 'rgba(59, 48, 53, 1)',
                            borderWidth: 1,
                            yAxisID: 'y-axis-rainfall'
                        },
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        'y-axis-rainfall': {
                            type: 'linear',
                            position: 'right',
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            title: {
                                display: true,
                                text: 'Rainfall (mm) / Snow (cm)'
                            }
                        },
                        'y-axis-temperature': {
                            type: 'linear',
                            position: 'left',
                            grid: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: `Temperature (°${currentUnit})` // Dynamic unit
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error("Error updating forecast chart:", error);
        });
}


        
        
        // Get Current Location
        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const { latitude, longitude } = position.coords;
                        fetchWeather(`${latitude},${longitude}`);
                    },
                    error => {
                        errorMessage.textContent = 'Unable to retrieve your location';
                        errorMessage.style.display = 'block';
                        fetchWeather("Harare");
                    }
                );
            } else {
                errorMessage.textContent = 'Geolocation is not supported by your browser';
                errorMessage.style.display = 'block';
                fetchWeather("Harare");
            }
        }

        // Event Listeners
        searchBtn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (city) fetchWeather(city);
        });

        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = cityInput.value.trim();
                if (city) fetchWeather(city);
            }
        });

        currentLocationBtn.addEventListener('click', getCurrentLocation);

        // Initial Load
        window.onload = () => {
            getCurrentLocation();
            setInterval(updateDateTime, 60000);
        };
