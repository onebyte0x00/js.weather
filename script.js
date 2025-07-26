const apiKey = "YOUR_OPENWEATHERMAP_API_KEY"; // Replace with your API key
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const cityName = document.getElementById("city-name");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const weatherIcon = document.getElementById("weather-icon");
const aqiElement = document.getElementById("aqi");
const sunriseElement = document.getElementById("sunrise");
const sunsetElement = document.getElementById("sunset");
const clothingAdvice = document.getElementById("clothing-advice");
const forecastList = document.getElementById("forecast-list");

// Event Listeners
searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeather(city);
    }
});

locationBtn.addEventListener("click", getLocation);

cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    }
});

// Initialize with default city
fetchWeather("London");

// Main Functions
async function fetchWeather(city) {
    try {
        // Current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
        );
        const weatherData = await weatherResponse.json();
        
        if (weatherData.cod === "404") {
            alert("City not found!");
            return;
        }

        updateUI(weatherData);
        updateBackground(weatherData);
        getClothingAdvice(weatherData.main.temp);
        fetchAQI(weatherData.coord.lat, weatherData.coord.lon);
        fetchForecast(city);
        
    } catch (error) {
        console.error("Error fetching weather:", error);
        alert("Failed to fetch weather data. Please try again.");
    }
}

function updateUI(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    temperature.textContent = `${Math.round(data.main.temp)}°C`;
    description.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    wind.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].description;
    
    // Convert sunrise/sunset from UTC to local time
    const sunriseTime = new Date(data.sys.sunrise * 1000);
    const sunsetTime = new Date(data.sys.sunset * 1000);
    
    sunriseElement.textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    sunsetElement.textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateBackground(data) {
    const body = document.body;
    const now = new Date();
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    
    // Reset classes
    body.className = '';
    
    // First check if it's night time
    if (now < sunrise || now > sunset) {
        body.classList.add('night-bg');
        return;
    }
    
    // Then set based on weather condition
    const condition = data.weather[0].main.toLowerCase();
    switch (condition) {
        case 'clear':
            body.classList.add('sunny-bg');
            break;
        case 'rain':
        case 'drizzle':
        case 'thunderstorm':
            body.classList.add('rainy-bg');
            break;
        case 'clouds':
            body.classList.add('cloudy-bg');
            break;
        case 'snow':
            body.classList.add('snowy-bg');
            break;
        default:
            // Default background
            body.style.background = '#f4f4f9';
    }
}

async function fetchAQI(lat, lon) {
    try {
        const response = await fetch(
            `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
        );
        const aqiData = await response.json();
        const aqi = aqiData.list[0].main.aqi;
        
        const aqiLevels = [
            { text: "Good", color: "#2ecc71" },
            { text: "Fair", color: "#f1c40f" },
            { text: "Moderate", color: "#e67e22" },
            { text: "Poor", color: "#e74c3c" },
            { text: "Very Poor", color: "#9b59b6" }
        ];
        
        const level = aqiLevels[aqi - 1];
        aqiElement.textContent = level.text;
        aqiElement.style.color = level.color;
    } catch (error) {
        console.error("Error fetching AQI:", error);
        aqiElement.textContent = "N/A";
    }
}

function getClothingAdvice(temp) {
    let advice = "";
    let icon = "";
    
    if (temp < 0) {
        advice = "Bundle up! Wear a heavy coat, gloves, scarf, and hat.";
        icon = "🧥🧣🧤";
    } else if (temp < 10) {
        advice = "Wear a warm coat and layers.";
        icon = "🧥";
    } else if (temp < 20) {
        advice = "A light jacket or sweater would be perfect.";
        icon = "🧥";
    } else if (temp < 30) {
        advice = "Comfortable in t-shirt and shorts.";
        icon = "👕🩳";
    } else {
        advice = "Stay cool! Light, breathable clothing recommended.";
        icon = "👕";
    }
    
    clothingAdvice.innerHTML = `${icon} ${advice}`;
}

async function fetchForecast(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`
        );
        const forecastData = await response.json();
        
        // Clear previous forecast
        forecastList.innerHTML = "";
        
        // Get one forecast per day (API returns every 3 hours)
        const dailyForecasts = [];
        for (let i = 0; i < forecastData.list.length; i += 8) {
            dailyForecasts.push(forecastData.list[i]);
        }
        
        // Display 5-day forecast
        dailyForecasts.slice(0, 5).forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayElement = document.createElement("div");
            dayElement.className = "forecast-day";
            
            dayElement.innerHTML = `
                <p>${date.toLocaleDateString('en', { weekday: 'short' })}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                <p>${Math.round(day.main.temp)}°C</p>
                <p>${day.weather[0].description}</p>
            `;
            
            forecastList.appendChild(dayElement);
        });
    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Could not get your location. Using default city.");
                fetchWeather("London");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );
        const data = await response.json();
        updateUI(data);
        updateBackground(data);
        getClothingAdvice(data.main.temp);
        fetchAQI(lat, lon);
        fetchForecastByCoords(lat, lon);
    } catch (error) {
        console.error("Error fetching weather by coordinates:", error);
    }
}

async function fetchForecastByCoords(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
        );
        const forecastData = await response.json();
        
        forecastList.innerHTML = "";
        
        const dailyForecasts = [];
        for (let i = 0; i < forecastData.list.length; i += 8) {
            dailyForecasts.push(forecastData.list[i]);
        }
        
        dailyForecasts.slice(0, 5).forEach(day => {
            const date = new Date(day.dt * 1000);
            const dayElement = document.createElement("div");
            dayElement.className = "forecast-day";
            
            dayElement.innerHTML = `
                <p>${date.toLocaleDateString('en', { weekday: 'short' })}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                <p>${Math.round(day.main.temp)}°C</p>
                <p>${day.weather[0].description}</p>
            `;
            
            forecastList.appendChild(dayElement);
        });
    } catch (error) {
        console.error("Error fetching forecast by coordinates:", error);
    }
}
