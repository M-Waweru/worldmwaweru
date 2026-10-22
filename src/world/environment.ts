export type GardenWeather = 'clear' | 'breeze' | 'rain'
export type GardenLight = 'day' | 'golden' | 'night'
export type GardenEnvironment = { weather: GardenWeather; light: GardenLight }

export function environmentProfile(environment: GardenEnvironment) {
  return {
    wind: environment.weather === 'breeze' ? 1.65 : environment.weather === 'rain' ? 1.25 : .65,
    rain: environment.weather === 'rain' ? 1 : 0,
    golden: environment.light === 'golden' ? 1 : 0,
    night: environment.light === 'night' ? 1 : 0,
  }
}
