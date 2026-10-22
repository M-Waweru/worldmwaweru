import { ArrowRight, Bike, CarFront, Plane, Rocket, Sailboat, MessageCircle } from 'lucide-react'
import { vehicleDefinitions, type VehicleId } from '../world/engine/vehicles'
import { mediaUrl, people, site } from '../content'

export const vehicleIcons = { bike: Bike, cruiser: CarFront, boat: Sailboat, plane: Plane, rocket: Rocket }
export function TravelContent({ ready, onVehicle, onPerson }: { ready: boolean; onVehicle(id: VehicleId): void; onPerson(id: string): void }) {
  return <section className="travel-content"><h1>{site.travelTitle}</h1><p className="sheet-lead">{site.travelIntro}</p>
    <figure className="travel-bike-photo"><img src={mediaUrl('/assets/photos/zontes-250v.webp')} alt="My real Zontes 250V, the reference for the bike in this world" width="960" height="640" /><figcaption>The real bike behind the little one in the garden.</figcaption></figure>
    {!ready && <p role="status">Vehicles are available when the 3D world is ready. You can still explore the workshop and writing.</p>}
    <div className="travel-list">{vehicleDefinitions.map(vehicle => { const Icon = vehicleIcons[vehicle.id]; return <article key={vehicle.id}><Icon size={27} strokeWidth={1.5} /><div><h2>{vehicle.name}</h2><small>{vehicle.location}</small><p>{vehicle.description}</p><button className="text-button" onClick={() => onVehicle(vehicle.id)} disabled={!ready}>Walk to {vehicle.id === 'bike' ? 'my bike' : vehicle.id === 'cruiser' ? 'the Land Cruiser' : vehicle.id === 'rocket' ? 'the launch field' : `the ${vehicle.id}`} <ArrowRight size={15} /></button></div></article> })}</div>
    <h2>{people.title}</h2><p>{people.intro}</p><div className="path-links">{people.people.map(person => <button key={person.id} disabled={!ready} onClick={() => onPerson(person.id)}><MessageCircle size={19} /><span>Meet {person.name}<small>{person.role}</small></span><ArrowRight size={16} /></button>)}</div>
  </section>
}
