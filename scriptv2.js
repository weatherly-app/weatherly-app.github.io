const apiKey = '4a2f11c859d54cea9a3110639241711';
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

        

        function updateHourlyForecastChart(data) {
            const hours = data.forecast.forecastday[0].hour;
            const currentHour = new Date().getHours();
            
            // Get next 24 hours of data, starting from current hour
            const hourlyData = [...hours.slice(currentHour), ...hours.slice(0, currentHour)].slice(0, 24);
            
            const labels = hourlyData.map(hour => {
                const date = new Date(hour.time);
                return date.toLocaleTimeString('en-US', { hour: 'numeric' });
            });
            
            const temperatures = hourlyData.map(hour => hour.temp_c);
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
                            label: 'Temperature (°C)',
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
                                text: 'Temperature (°C)'
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
                            // Add these properties to set the minimum value and prevent negative values
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

        async function updateForecastChart(latitude, longitude) {
            const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum&timezone=auto&forecast_days=14`;
        
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`Error fetching weather data: ${response.statusText}`);
                }
        
                const weatherData = await response.json();
                const forecastData = weatherData.daily;
        
                const dates = forecastData.time.map(date => 
                    new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
                );
                const temperatures = forecastData.temperature_2m_max.map((max, index) => 
                    (max + forecastData.temperature_2m_min[index]) / 2
                );
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
                                label: 'Temperature (°C)',
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
            } catch (error) {
                console.error("Error updating forecast chart:", error);
            }
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
