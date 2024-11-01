const apiKey = '11e5e890f3eb43d2834153732240111';
        let currentUnit = 'C';

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

        // Fetch Weather Data
        async function fetchWeather(city) {
            try {
                const response = await fetch(
                    `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=14&aqi=yes`
                );

                if (!response.ok) throw new Error('City not found');

                const data = await response.json();
                updateWeatherUI(data);
                updateForecastChart(data.forecast.forecastday);
                errorMessage.style.display = 'none';
            } catch (error) {
                errorMessage.textContent = 'City not found. Please try again.';
                errorMessage.style.display = 'block';
            }
        }

        // Update Weather UI
        function updateWeatherUI(data) {
            document.getElementById('city').textContent = data.location.name;
            document.getElementById('country').textContent = `${data.location.region}, ${data.location.country}`;
            document.getElementById('temp').textContent = Math.round(data.current.temp_c);
            document.getElementById('weather-desc').textContent = data.current.condition.text;
            document.getElementById('weather-icon').src = data.current.condition.icon;
            document.getElementById('feels-like').textContent = `${Math.round(data.current.feelslike_c)}°C`;
            document.getElementById('humidity').textContent = `${data.current.humidity}%`;
            document.getElementById('wind-speed').textContent = `${data.current.wind_kph} km/h`;
            document.getElementById('wind-dir').textContent = data.current.wind_dir;

            updateDateTime();
        }

        // Update Forecast Chart
        function updateForecastChart(forecastData) {
            const dates = forecastData.map(day => new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }));
            const temperatures = forecastData.map(day => day.day.avgtemp_c);
            const rainfall = forecastData.map(day => day.day.totalprecip_mm);

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
                            label: 'Rainfall (mm)',
                            data: rainfall,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1,
                            yAxisID: 'y-axis-rainfall'
                        },
                        {
                            label: 'Temperature (°C)',
                            data: temperatures,
                            type: 'line',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            fill: false,
                            tension: 0.4,
                            yAxisID: 'y-axis-temperature'
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
                        'y-axis-rainfall': {
                            type: 'linear',
                            position: 'left',
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            title: {
                                display: true,
                                text: 'Rainfall (mm)'
                            }
                        },
                        'y-axis-temperature': {
                            type: 'linear',
                            position: 'right',
                            grid: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Temperature (°C)'
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
                    }
                );
            } else {
                errorMessage.textContent = 'Geolocation is not supported by your browser';
                errorMessage.style.display = 'block';
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
            fetchWeather('Harare');
            setInterval(updateDateTime, 60000);
        };