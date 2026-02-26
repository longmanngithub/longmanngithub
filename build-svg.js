import fs from 'fs'
import got from 'got'
import Qty from 'js-quantities/esm'
import { formatDistance } from 'date-fns'
import { DateTime } from 'luxon'

// --- Open-Meteo Configuration ---
// No API key needed!
const LAT = '11.5625' // Latitude for Phnom Penh, Cambodia
const LON = '104.916' // Longitude for Phnom Penh, Cambodia
const WEATHER_API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weather_code,temperature_2m_max&temperature_unit=fahrenheit&timezone=auto`

// WMO Weather interpretation codes to Emojis
// See: https://open-meteo.com/en/docs
const wmoCodeEmojis = {
  0: '☀️', // Clear sky
  1: '🌤️', // Mainly clear
  2: '🌥️', // Partly cloudy
  3: '☁️', // Overcast
  45: '🌫️', // Fog
  48: '🌫️', // Depositing rime fog
  51: '💧', // Drizzle: Light
  53: '💧', // Drizzle: Moderate
  55: '💧', // Drizzle: Dense
  56: '💧🧊', // Freezing Drizzle: Light
  57: '💧🧊', // Freezing Drizzle: Dense
  61: '🌧️', // Rain: Slight
  63: '🌧️', // Rain: Moderate
  65: '🌧️', // Rain: Heavy
  66: '🌧️🧊', // Freezing Rain: Light
  67: '🌧️🧊', // Freezing Rain: Dense
  71: '🌨️', // Snow fall: Slight
  73: '❄️', // Snow fall: moderate
  75: '☃️', // Snow fall: Heavy
  77: '❄️', // Snow grains
  80: '🌦️', // Rain showers: Slight
  81: '🌦️', // Rain showers: Moderate
  82: '🌦️', // Rain showers: Violent
  85: '🌨️❄️', // Snow showers: Slight
  86: '🌨️❄️', // Snow showers: Heavy
  95: '⛈️', // Thunderstorm
  95: '⛈️🧊', // Thunderstorm with slight hail
  95: '⛈️🧊', // Thunderstorm with heavy hail
  // I added all the codes that open-meteo has available
  default: '✨'
};

// Cheap, janky way to have variable bubble width
const dayBubbleWidths = {
  Monday: 235,
  Tuesday: 235,
  Wednesday: 260,
  Thursday: 245,
  Friday: 220,
  Saturday: 245,
  Sunday: 230,
}

// Time working at Luxon
const today = DateTime.now().setZone('Asia/Bangkok')
const todayDay = today.toFormat('cccc')

const luxonTime = formatDistance(new Date(2020, 12, 14), today.toJSDate(), {
  addSuffix: false,
})

// --- Fetch and Process Data ---
got(WEATHER_API_URL)
  .then((response) => {
    const json = JSON.parse(response.body)
    const dailyData = json.daily

    const degF = Math.round(dailyData.temperature_2m_max[0])
    const degC = Math.round(Qty(`${degF} tempF`).to('tempC').scalar)
    const weatherCode = dailyData.weather_code[0]
    const icon = wmoCodeEmojis[weatherCode] || wmoCodeEmojis.default

    fs.readFile('template.svg', 'utf-8', (error, data) => {
      if (error) {
        console.error('Error reading template file:', error)
        return
      }

      data = data.replace('{degF}', degF)
      data = data.replace('{degC}', degC)
      data = data.replace('{weatherEmoji}', icon)
      data = data.replace('{luxonTime}', luxonTime)
      data = data.replace('{todayDay}', todayDay)
      data = data.replace('{dayBubbleWidth}', dayBubbleWidths[todayDay])

      fs.writeFile('chat.svg', data, (err) => {
        if (err) {
          console.error('Error writing SVG file:', err)
        }
      })
    })
  })
  .catch((err) => {
    console.error('Failed to fetch weather data:', err)
  })

  
