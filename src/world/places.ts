export type PlaceId = 'cottage' | 'studio' | 'harbour' | 'cabin'

export const places: { id: PlaceId; name: string; purpose: string; position: [number, number]; weather: string }[] = [
  { id: 'cottage', name: 'The cottage', purpose: 'A little about me', position: [-24, 5], weather: 'A quiet afternoon' },
  { id: 'studio', name: 'The studio', purpose: 'Things I make', position: [23, -8], weather: 'The windows are open' },
  { id: 'harbour', name: 'The harbour', purpose: 'Writing & ideas', position: [14, 39], weather: 'A breeze off the water' },
  { id: 'cabin', name: 'The cabin', purpose: 'Notes on life', position: [-29, -42], weather: 'Somewhere a little quieter' },
]

export function getPlace(id: PlaceId) {
  return places.find((place) => place.id === id)!
}
